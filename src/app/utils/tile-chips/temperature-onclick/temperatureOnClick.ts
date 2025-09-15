// src/actions/temperatureOnClick.ts
import apiClient from "@/api/apiClient";
import CommonResponse from "@/api/response/common_response";
import { getCameraPosition } from "@/app/components/organisms/cesium/util/getCameraPosition";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";
import { Temperature } from "@/api/response/temperatureReponse";
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
    const response = await apiClient.get<CommonResponse<Temperature[]>>(
        "/api/v1/temperature/forecast",
        {
            baseURL: process.env.NEXT_PUBLIC_FASTAPI_URL,
            params: {
                lat: point.lat,
                lon: point.lon
            }
        }
    );
    const temperatures:Temperature[] = response.data.data ?? [];

    temperatures.sort((a, b) => (a.fcstDate + a.fcstTime).localeCompare(b.fcstDate + b.fcstTime));
    const target = temperatures[0];
    const tempValue: number | null = target?.fcstValue ?? null;

    // EMD 폴리곤
    const emdRes = await apiClient.get<EmdResponse>(
        "/api/v1/geoms/emd",
        {
            baseURL: process.env.NEXT_PUBLIC_FASTAPI_URL,
            params: {
                lat: point.lat,
                lon: point.lon
            }
        }
    );

    const feature: EmdFeature | null = emdRes.data.feature;
    if (!feature) {
        alert("해당 위치의 읍면동 폴리곤을 찾지 못했습니다.");
        return;
    }

    const geojson: FeatureCollection = {
        type: "FeatureCollection",
        features: [{
            type: "Feature",
            properties: feature.properties,
            geometry: feature.geometry
        }],
    };

    const color = getColor(tempValue);

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

    await viewer.dataSources.add(ds);
}

/**
 * 온도 → 색상 매핑
 *  -5℃ 이하  : 파랑(최대 파란값)
 *  -5℃ ~ 0℃ : 파랑 → 하양 선형 보간
 *   0℃ ~ 30℃: 하양 → 빨강 선형 보간
 *  30℃ 이상 : 빨강(최대 빨간값)
 *
 * 파랑(영하) > 하양(0℃) > 빨강(영상) 그라디언트
 */
const getColor = (temperature: number): Cesium.Color => {
    console.log(temperature);
    // 온도 최대값 최소값 지정
    const coldStop = -5;
    const hotStop = 30;

    const blue = Cesium.Color.BLUE;
    const white = Cesium.Color.WHITE;
    const red = Cesium.Color.RED;

    // 채널(0~1) 선형보간 헬퍼
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    // 경계 클램프
    if (temperature <= coldStop) return new Cesium.Color(blue.red, blue.green, blue.blue, 1.0);
    if (temperature >= hotStop)  return new Cesium.Color(red.red,  red.green,  red.blue,  1.0);

    // -5℃ ~ 0℃ : Blue -> White
    if (temperature < 0) {
        const t = (temperature - coldStop) / (0 - coldStop); // 0~1
        const r = lerp(blue.red,   white.red,   t);
        const g = lerp(blue.green, white.green, t);
        const b = lerp(blue.blue,  white.blue,  t);
        return new Cesium.Color(r, g, b, 1.0);
    }

    // 0℃ ~ 30℃ : White -> Red
    const t = (temperature - 0) / (hotStop - 0); // 0~1
    const r = lerp(white.red,   red.red,   t);
    const g = lerp(white.green, red.green, t);
    const b = lerp(white.blue,  red.blue,  t);
    return new Cesium.Color(r, g, b, 1.0);
};
