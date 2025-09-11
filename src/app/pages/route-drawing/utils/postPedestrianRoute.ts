// src/app/pages/route-drawing/utils/postPedestrianRoute.ts
import { PedestrianResponse } from "@/api/response/pedestrianResponse";
import apiClient from "@/api/apiClient";
import {JulianDate, Entity, Cartesian3} from "cesium";
import * as Cesium from "cesium";

/** 내부 API 래퍼 (단일 구간: start + 최대 5 경유 + end) */
async function pedestrianRouteAPI(params: {
    startX: number; startY: number;
    endX: number; endY: number;
    passList?: string;
}): Promise<PedestrianResponse> {
    const { startX, startY, endX, endY, passList } = params;
    const response = await apiClient.post<PedestrianResponse>(
        "/tmap/routes/pedestrian?version=1&format=json",
        {
            startX, startY, endX, endY, passList,
            reqCoordType: "WGS84GEO",
            resCoordType: "WGS84GEO",
            searchOption: "30",
            sort: "index",
            startName: "출발지",
            endName: "도착지",
        },
        {
            baseURL: "https://apis.openapi.sk.com",
            headers: { appKey: process.env.NEXT_PUBLIC_TMAP_APP_KEY },
        }
    );
    return response.data;
}

/**
 * 좌표([lng,lat][])를 받아
 * "시작 + 최대 5 경유 + 끝" 으로 끊어서 **순차 호출** 후, 결과를 **원래 순서대로 병합**
 */
export async function getPedestrianRoute(
    coordinates: [number, number][]
): Promise<PedestrianResponse> {
    const MAX_VIAS = 5;               // 경유지 최대 5개
    const n = coordinates.length;
    if (n < 2) {
        return { type: "FeatureCollection", features: [] };
    }

    const merged: PedestrianResponse = { type: "FeatureCollection", features: [] };

    // i는 세그먼트의 "시작 인덱스"
    // 한 세그먼트: start(i) + via(i+1..i+viaCount) + end(i+viaCount+1)
    // 다음 세그먼트는 end가 곧 다음 start (연결 보장)
    let i = 0;
    while (i < n - 1) {
        const remaining = (n - 1) - i;          // 이번 시작점 이후 남은 "이동 가능한 간격" 수
        const viaCount  = Math.min(MAX_VIAS, Math.max(0, remaining - 1)); // 끝 하나는 남겨둬야 하므로 -1
        const endIndex  = i + viaCount + 1;     // 이번 세그먼트의 끝 인덱스

        const [startX, startY] = coordinates[i];
        const [endX, endY]     = coordinates[endIndex];

        // passList: i+1 .. i+viaCount (viaCount가 0이면 passList 없음)
        const passList = viaCount > 0
            ? new Array(viaCount)
                .fill(0)
                .map((_, k) => {
                    const [vx, vy] = coordinates[i + 1 + k];
                    return `${vx},${vy}`;
                })
                .join("_")
            : undefined;

        // ✅ 순차 실행
        const segment = await pedestrianRouteAPI({ startX, startY, endX, endY, passList });

        // 병합: 그대로 이어붙인다 (필요 시 중복 좌표 dedup 로직 추가 가능)
        if (segment?.features?.length) {
            merged.features.push(...segment.features);
        }

        // 다음 세그먼트 시작은 "이번 end" 위치
        i = endIndex;
    }

    return merged;
}

/** Entity[] → [lng,lat][] */
export function entitiesToLngLat(
    markers: Entity[],
    when?: JulianDate
): [number, number][] {
    const time = when ?? Cesium.JulianDate.now();

    const toLngLat = (p: Cartesian3): [number, number] => {
        const carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(p);
        return [
            Cesium.Math.toDegrees(carto.longitude),
            Cesium.Math.toDegrees(carto.latitude),
        ];
    };

    return markers
        .map((m) => m.position?.getValue(time) as Cartesian3 | undefined)
        .filter((p): p is Cartesian3 => !!p)
        .map(toLngLat);
}
