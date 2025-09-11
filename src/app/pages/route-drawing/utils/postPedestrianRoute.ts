// src/app/pages/route-drawing/utils/postPedestrianRoute.ts
import { PedestrianResponse } from "@/api/response/pedestrianResponse";
import apiClient from "@/api/apiClient";

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
 * 좌표 배열([lng,lat][])을 받아
 * "시작 + 최대 5 경유 + 끝" 배치로 호출 → 병합
 */
export async function getPedestrianRoute(coordinates: [number, number][]):Promise<PedestrianResponse> {
    // 3) 5개 단위로 세그먼트 요청을 모아 실행
    const tasks: Promise<PedestrianResponse>[] = [];
    for (let i = 0; i < coordinates.length - 1; i += 5) {
        const [startX, startY] = coordinates[i];

        const remaining = coordinates.length - (i + 1);
        const stepCount = Math.min(5, remaining); // 이번 배치에서 사용할 경유지 수(최대 5)

        const passListCoords: string[] = [];
        for (let j = 1; j < stepCount; j++) {
            const [viaX, viaY] = coordinates[i + j];
            passListCoords.push(`${viaX},${viaY}`);
        }
        const passList = passListCoords.length ? passListCoords.join("_") : undefined;

        const [endX, endY] = coordinates[i + stepCount];
        tasks.push(pedestrianRouteAPI({ startX, startY, endX, endY, passList }));
    }

    const pedestrianResponses: PedestrianResponse = {
        features: [],
        type: "FeatureCollection"
    };

    // 4) 세그먼트 합치기(연속 중복 제거)
    const segments = await Promise.all(tasks);
    for (const segment of segments) {
            pedestrianResponses.features.push(...segment.features)
    }

    return pedestrianResponses;
}