// src/actions/temperatureOnClick.ts
import apiClient from "@/api/apiClient";
import CommonResponse from "@/api/response/common_response";
import { getCameraPosition } from "@/app/components/organisms/cesium/util/getCameraPosition";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";
import { TemperatureResponse, Temperature } from "@/api/response/temperatureReponse";
import * as Cesium from "cesium";
import type { Feature, FeatureCollection, Geometry } from "geojson";

// 백엔드 응답 타입 (feature는 EMD 폴리곤 또는 null)
type EmdFeature = Feature<Geometry, { bjd_cd: string; bjd_nm: string }>;
interface EmdResponse { feature: EmdFeature | null; }

/**
 * TMP(기온) 표시 Chip 버튼 클릭 핸들러
 */
export default async function temperatureOnClick() {
    const viewer = getViewer();
    const point = getCameraPosition(); // { lat, lon }

    // NOTE 1. 해당 위치의 온도 정보를 얻는다.
    // 온도 정보 API를 요청
    const response = await apiClient.get<CommonResponse<TemperatureResponse>>(
        "/api/v1/temperature/forecast",
        {
            baseURL: process.env.NEXT_PUBLIC_FASTAPI_URL,
            params: {
                lat: point.lat,
                lon: point.lon,
                radius_m: 500
            }
        }
    );
    const temperature: Temperature[] = response.data?.data?.temperature ?? [];
    temperature.sort((a, b) => (a.fcstDate + a.fcstTime).localeCompare(b.fcstDate + b.fcstTime));
    const target = temperature[0];
    const tempValue: number | null = target?.fcstValue ?? null;

    // EMD 폴리곤
    const emdRes = await apiClient.get<EmdResponse>(
        "/api/v1/geoms/emd",
        { baseURL: process.env.NEXT_PUBLIC_FASTAPI_URL, params: { lat: point.lat, lon: point.lon } }
    );

    const feature: EmdFeature | null = emdRes.data.feature;
    if (!feature) {
        console.warn("해당 위치의 읍면동 폴리곤을 찾지 못했습니다.");
        return;
    }

    // geometry가 문자열로 올 가능성 방어
    const geometry: Geometry = feature.geometry;

    const geojson: FeatureCollection = {
        type: "FeatureCollection",
        features: [{ type: "Feature", properties: feature.properties, geometry }],
    };

    const color = _colorByTemperature(tempValue);

    // 기존 DS 제거
    const prev = viewer.dataSources.getByName("emd-temperature");
    prev.forEach((ds) => viewer.dataSources.remove(ds, true));

    const ds = await Cesium.GeoJsonDataSource.load(geojson, { clampToGround: true });
    ds.name = "emd-temperature";

    // 스타일
    for (const e of ds.entities.values) {
        if (e.polygon) {
            e.polygon.material = new Cesium.ColorMaterialProperty(color.withAlpha(0.6));
            e.polygon.outline = new Cesium.ConstantProperty(true);
            e.polygon.outlineColor = new Cesium.ConstantProperty(Cesium.Color.BLACK.withAlpha(0.8));
            e.polygon.outlineWidth = new Cesium.ConstantProperty(1.0);
        }
        e.label = new Cesium.LabelGraphics({
            text: new Cesium.ConstantProperty(
                tempValue != null ? `${(tempValue as number).toFixed?.(1) ?? tempValue}℃` : "N/A"
            ),
            fillColor: new Cesium.ConstantProperty(Cesium.Color.WHITE),
            font: new Cesium.ConstantProperty("16px sans-serif"),
            pixelOffset: new Cesium.ConstantProperty(new Cesium.Cartesian2(0, -20)),
            heightReference: new Cesium.ConstantProperty(Cesium.HeightReference.CLAMP_TO_GROUND),
            showBackground: new Cesium.ConstantProperty(true),
            backgroundColor: new Cesium.ConstantProperty(Cesium.Color.BLACK.withAlpha(0.5)),
        });
    }

    viewer.dataSources.add(ds);
    viewer.flyTo(ds, { duration: 0.8 });
}

/** 온도→색상 매핑: 파랑 → 보라 → 빨강 */
const _colorByTemperature = (temp: number | null): Cesium.Color => {
    if (temp == null || !isFinite(temp)) return Cesium.Color.GRAY;
    const minT = -10, maxT = 35;
    const t = Math.max(0, Math.min(1, (temp - minT) / (maxT - minT)));
    const c1 = Cesium.Color.BLUE, c2 = Cesium.Color.PURPLE, c3 = Cesium.Color.RED;

    const lerp01 = (a: number, b: number, k: number) => a + (b - a) * k;
    if (t < 0.5) {
        const k = t / 0.5;
        return Cesium.Color.fromAlpha(
            Cesium.Color.fromBytes(lerp01(c1.red, c2.red, k) * 255, lerp01(c1.green, c2.green, k) * 255, lerp01(c1.blue, c2.blue, k) * 255, 255),
            1
        );
    } else {
        const k = (t - 0.5) / 0.5;
        return Cesium.Color.fromAlpha(
            Cesium.Color.fromBytes(lerp01(c2.red, c3.red, k) * 255, lerp01(c2.green, c3.green, k) * 255, lerp01(c2.blue, c3.blue, k) * 255, 255),
            1
        );
    }
};
