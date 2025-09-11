// src/app/pages/route-drawing/utils/postPedestrianRoute.ts
import { PedestrianResponse } from "@/api/response/pedestrianResponse";
import apiClient from "@/api/apiClient";

const EPS = 1e-12;
const isFiniteNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

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

/** 좌표가 같으면 건너뛰기 (렌더/거리 계산용 인접중복 제거) */
function pushIfNotDuplicate(acc: [number, number][], c: [number, number]) {
    if (acc.length === 0) { acc.push(c); return; }
    const [plng, plat] = acc[acc.length - 1];
    const [clng, clat] = c;
    if (Math.abs(plng - clng) > EPS || Math.abs(plat - clat) > EPS) acc.push(c);
}

/** Feature.index를 0..N-1로 재부여 + 인접 좌표 중복 제거(LineString의 선두 중복 제거) */
function mergeAndRenumber(responses: PedestrianResponse[]): PedestrianResponse {
    const merged: PedestrianResponse["features"] = [];

    // 1) 응답 순서대로 합치되, 각 응답 내부도 properties.index 기준 정렬
    const allFeatures = responses.flatMap(r => r?.features ?? []);
    allFeatures.sort((a, b) => (a?.properties?.index ?? 0) - (b?.properties?.index ?? 0));

    // 2) 인접 LineString의 연결부 duplicated 좌표 제거
    let lastTail: [number, number] | undefined;

    for (const f of allFeatures) {
        if (!f?.geometry) continue;

        if (f.geometry.type === "Point") {
            const pt = f.geometry.coordinates as [number, number];
            if (!isFiniteNum(pt?.[0]) || !isFiniteNum(pt?.[1])) continue;

            // Point가 직전 LineString의 꼬리와 동일하면 스킵(선택)
            if (lastTail && Math.abs(lastTail[0] - pt[0]) < EPS && Math.abs(lastTail[1] - pt[1]) < EPS) {
                // skip duplicate anchor
            } else {
                merged.push({
                    ...f,
                    properties: { ...f.properties }, // index는 나중에 일괄 재부여
                });
            }
            // Point는 tail 업데이트하지 않음
            continue;
        }

        if (f.geometry.type === "LineString") {
            const coords = (f.geometry.coordinates ?? []) as [number, number][];
            if (!Array.isArray(coords) || coords.length === 0) continue;

            // 선두 좌표가 직전 tail과 동일하면 제거
            const fixed: [number, number][] = [];
            for (let i = 0; i < coords.length; i++) {
                const c = coords[i];
                if (!isFiniteNum(c?.[0]) || !isFiniteNum(c?.[1])) continue;

                if (i === 0 && lastTail &&
                    Math.abs(lastTail[0] - c[0]) < EPS && Math.abs(lastTail[1] - c[1]) < EPS) {
                    // drop first duplicated coord
                    continue;
                }
                pushIfNotDuplicate(fixed, c);
            }

            if (fixed.length === 0) continue;
            lastTail = fixed[fixed.length - 1]; // tail 갱신

            merged.push({
                ...f,
                geometry: { type: "LineString", coordinates: fixed },
                properties: { ...f.properties }, // index는 나중에 재부여
            });
        }

        // 기타 타입은 스킵
    }

    // 3) index 0..N-1 재부여 (point/line 모두)
    for (let i = 0; i < merged.length; i++) {
        merged[i] = {
            ...merged[i],
            properties: { ...merged[i].properties, index: i },
        };
    }

    return { type: "FeatureCollection", features: merged };
}

/**
 * 좌표 배열([lng,lat][])을 받아 Tmap 보행자 경로 API를
 * "시작 + 최대 5 경유 + 끝" 배치로 호출하여
 * 단일 FeatureCollection으로 병합합니다.
 *
 * - 좌표는 WGS84 경도/위도 순서([lng, lat])여야 합니다.
 * - 각 배치의 결과 features는 index를 0..N-1로 재부여합니다.
 * - 인접 LineString 연결부의 중복 좌표를 제거해 깨끗하게 이어붙입니다.
 */
export async function getPedestrianResponse(
    coordinates: [number, number][]
): Promise<PedestrianResponse> {
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
        return { type: "FeatureCollection", features: [] };
    }

    // 연속 중복 좌표 제거(요청 자체도 깔끔하게)
    const anchors: [number, number][] = [];
    for (const c of coordinates) {
        if (isFiniteNum(c?.[0]) && isFiniteNum(c?.[1])) {
            pushIfNotDuplicate(anchors, c);
        }
    }
    if (anchors.length < 2) return { type: "FeatureCollection", features: [] };

    const tasks: Promise<PedestrianResponse>[] = [];

    // 배치: start + 최대 5 경유 + end
    // i는 "현재 start의 인덱스"이며, 처리 후 i를 end 인덱스로 점프
    let i = 0;
    while (i < anchors.length - 1) {
        // 남은 점 개수
        const remaining = anchors.length - 1 - i; // 최소 1 (end는 반드시 있어야 함)

        // 이번 호출에 포함할 경유지 수 (최대 5개)
        const viaCount = Math.min(5, Math.max(0, remaining - 1));
        const endIdx = i + viaCount + 1;

        const [startX, startY] = anchors[i];
        const [endX, endY] = anchors[endIdx];

        // passList "x,y_x,y_..." (경유지들만)
        let passList: string | undefined;
        if (viaCount > 0) {
            const parts: string[] = [];
            for (let j = i + 1; j < endIdx; j++) {
                const [vx, vy] = anchors[j];
                parts.push(`${vx},${vy}`);
            }
            passList = parts.join("_");
        }

        tasks.push(pedestrianRouteAPI({ startX, startY, endX, endY, passList }));

        // 다음 batch의 시작은 방금 endIdx가 됨
        i = endIdx;
    }

    const responses = await Promise.all(tasks);
    return mergeAndRenumber(responses);
}
