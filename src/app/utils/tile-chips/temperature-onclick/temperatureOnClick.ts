// src/actions/temperatureOnClick.ts
import apiClient from "@/api/apiClient";
import CommonResponse from "@/api/response/common_response";
import { getCameraPosition } from "@/app/components/organisms/cesium/util/getCameraPosition";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";
import { Temperature } from "@/api/response/temperatureReponse";
import * as Cesium from "cesium";
import type { Feature, FeatureCollection, Geometry } from "geojson";

type EmdFeature = Feature<Geometry, { bjd_cd: string; bjd_nm: string }>;
interface EmdResponse { feature: EmdFeature | null; }

/** 문자열/숫자 섞여 올 수 있는 값을 안전하게 number로 */
function toNumberOrNull(v: unknown): number | null {
    const n = typeof v === "number" ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : null;
}

/** 현재 떠 있는 emd-temperature 데이터소스를 제거 */
export function removeTemperature() {
    const viewer = getViewer();
    const list = viewer.dataSources.getByName("emd-temperature");
    list.forEach((ds) => viewer.dataSources.remove(ds, true));
}

/** 온도 스톱 기반 색상 계산 */
function getColorByStops(t: number | null): Cesium.Color {
    const ALPHA = 0.6;

    // 유효치 없으면 회색 반투명
    if (t == null || !Number.isFinite(t)) {
        return Cesium.Color.fromBytes(128, 128, 128, Math.round(ALPHA * 255));
    }

    // 지정 색상
    const DEEP_BLUE = Cesium.Color.fromBytes(  0,  90, 200); // 21.5℃
    const PINK      = Cesium.Color.fromBytes(255, 105, 180); // 22.0℃
    const GREEN     = Cesium.Color.fromBytes(  0, 150, 220); // 22.5℃
    const WHITE     = Cesium.Color.fromBytes(255, 255, 255); // 23.0℃
    const YELLOW    = Cesium.Color.fromBytes(255, 255,   0); // 23.5℃
    const ORANGE    = Cesium.Color.fromBytes(255, 152,   0); // 24.0℃
    const RED       = Cesium.Color.fromBytes(211,  47,  47); // 24.5℃
    const PURPLE    = Cesium.Color.fromBytes(156,  39, 176); // 25.0℃

    const stops: Array<{ temp: number; color: Cesium.Color }> = [
        { temp: 21.5, color: DEEP_BLUE },
        { temp: 22.0, color: PINK      },
        { temp: 22.5, color: GREEN     },
        { temp: 23.0, color: WHITE     },
        { temp: 23.5, color: YELLOW    },
        { temp: 24.0, color: ORANGE    },
        { temp: 24.5, color: RED       },
        { temp: 25.0, color: PURPLE    },
    ];

    if (t <= stops[0].temp) return stops[0].color.withAlpha(ALPHA);
    if (t >= stops[stops.length - 1].temp) return stops[stops.length - 1].color.withAlpha(ALPHA);

    for (let i = 0; i < stops.length - 1; i++) {
        const a = stops[i], b = stops[i + 1];
        if (t >= a.temp && t <= b.temp) {
            const k  = (t - a.temp) / (b.temp - a.temp);
            const r  = a.color.red   + (b.color.red   - a.color.red)   * k;
            const g  = a.color.green + (b.color.green - a.color.green) * k;
            const bl = a.color.blue  + (b.color.blue  - a.color.blue)  * k;
            return new Cesium.Color(r, g, bl, ALPHA);
        }
    }
    return WHITE.withAlpha(ALPHA);
}

/* -----------------------------
   자동 새로고침(드래그) 관리
------------------------------ */
let tracking = false;
let moveStartHandler: (() => void) | null = null;
let moveEndHandler:   (() => void) | null = null;
let fetchToken = 0; // 최신 요청 토큰 (중복/지연 응답 무시)

/** 실제 조회 + 렌더 (항상 최신 토큰만 반영) */
async function refreshTemperature(): Promise<void> {
    const viewer = getViewer();
    const point = getCameraPosition();

    const myToken = ++fetchToken;
    try {
        // 1) 온도 조회
        const resp = await apiClient.get<CommonResponse<Temperature[]>>(
            "/api/v1/temperature/forecast",
            { baseURL: process.env.NEXT_PUBLIC_FASTAPI_URL, params: { lat: point.lat, lon: point.lon } }
        );
        if (myToken !== fetchToken) return; // 오래된 응답 버림

        const temps: Temperature[] = resp.data.data ?? [];
        temps.sort((a, b) => (a.fcstDate + a.fcstTime).localeCompare(b.fcstDate + b.fcstTime));
        const target = temps[0];
        const temp = toNumberOrNull(target?.fcstValue);

        // 2) EMD 폴리곤 조회
        const emdRes = await apiClient.get<{ feature: EmdFeature | null }>(
            "/api/v1/geoms/emd",
            { baseURL: process.env.NEXT_PUBLIC_FASTAPI_URL, params: { lat: point.lat, lon: point.lon } }
        );
        if (myToken !== fetchToken) return;

        const feature = emdRes.data.feature;
        if (!feature) {
            removeTemperature();
            alert("해당 위치의 읍면동 폴리곤을 찾지 못했습니다.");
            return;
        }

        // 기존 제거 후 로드
        removeTemperature();

        const geojson: FeatureCollection = {
            type: "FeatureCollection",
            features: [{ type: "Feature", properties: feature.properties, geometry: feature.geometry }],
        };
        const ds = await Cesium.GeoJsonDataSource.load(geojson, { clampToGround: true });
        ds.name = "emd-temperature";

        const fill = getColorByStops(temp);

        for (const e of ds.entities.values) {
            if (e.polygon) {
                e.polygon.material = new Cesium.ColorMaterialProperty(fill);
                e.polygon.outline = new Cesium.ConstantProperty(true);
                e.polygon.outlineColor = new Cesium.ConstantProperty(Cesium.Color.BLACK.withAlpha(0.9));
            }
            e.label = new Cesium.LabelGraphics({
                text: new Cesium.ConstantProperty(
                    temp != null ? `${temp.toFixed(1)}℃` : "N/A"
                ),
                fillColor: new Cesium.ConstantProperty(Cesium.Color.WHITE),
                font: new Cesium.ConstantProperty("16px sans-serif"),
                pixelOffset: new Cesium.ConstantProperty(new Cesium.Cartesian2(0, -20)),
                heightReference: new Cesium.ConstantProperty(Cesium.HeightReference.CLAMP_TO_GROUND),
                showBackground: new Cesium.ConstantProperty(true),
                backgroundColor: new Cesium.ConstantProperty(Cesium.Color.BLACK.withAlpha(0.5)),
            });
        }

        await viewer.dataSources.add(ds);
    } catch (e) {
        // 실패 시 기존 레이어만 제거하고 조용히 무시(원하면 토스트)
        removeTemperature();
        // console.error(e);
    }
}

/** 토글 ON: 리스너 등록 + 즉시 1회 렌더 */
export default async function temperatureOnClick() {
    if (tracking) return; // 이미 동작 중이면 무시
    const viewer = getViewer();

    // moveStart: 사용자 이동 시작 → 바로 지우기(깜빡임 최소화)
    moveStartHandler = () => {
        removeTemperature();
        // 이전 요청이 응답 와도 반영되지 않도록 토큰만 증가
        fetchToken++;
    };

    // moveEnd: 이동 종료 → 최신 위치로 재조회
    moveEndHandler = () => {
        if (!tracking) return;
        void refreshTemperature();
    };

    viewer.camera.moveStart.addEventListener(moveStartHandler);
    viewer.camera.moveEnd.addEventListener(moveEndHandler);

    tracking = true;

    // 최초 1회 렌더
    await refreshTemperature();
}

/** 토글 OFF: 리스너 해제 + 레이어 제거 */
export function stopTemperatureTracking() {
    if (!tracking) return;
    const viewer = getViewer();

    if (moveStartHandler) viewer.camera.moveStart.removeEventListener(moveStartHandler);
    if (moveEndHandler)   viewer.camera.moveEnd.removeEventListener(moveEndHandler);

    moveStartHandler = null;
    moveEndHandler = null;
    tracking = false;

    // 떠 있는 폴리곤 제거
    removeTemperature();

    // 이후 들어올 수 있는 늦은 응답들 무시
    fetchToken++;
}
