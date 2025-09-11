// src/app/pages/route-drawing/utils/postPedestrianRoute.ts
import { PedestrianResponse, Feature } from "@/api/response/pedestrianResponse";
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

/**
 * 🔧 핵심 수정:
 * - responses 배열 **순서대로** 처리한다(배치 순서 보존).
 * - 각 배치 **내부에서만** properties.index로 정렬.
 * - 전역 정렬은 하지 않는다.
 * - 라인 연결부 중복 좌표는 lastTail로 제거.
 * - 마지막에 0..N-1로 재인덱싱.
 */
function mergeAndRenumber(responses: PedestrianResponse[]): PedestrianResponse {
    const merged: Feature[] = [];
    let lastTail: [number, number] | undefined;

    for (const resp of responses) {
        const feats = (resp?.features ?? []).slice()
            .sort((a, b) => (a?.properties?.index ?? 0) - (b?.properties?.index ?? 0));

        for (const f of feats) {
            if (!f?.geometry) continue;

            if (f.geometry.type === "Point") {
                const pt = f.geometry.coordinates as [number, number];
                if (!isFiniteNum(pt?.[0]) || !isFiniteNum(pt?.[1])) continue;

                // 직전 라인의 꼬리와 동일한 앵커 포인트는 스킵(선택)
                if (lastTail && Math.abs(lastTail[0] - pt[0]) < EPS && Math.abs(lastTail[1] - pt[1]) < EPS) {
                    continue;
                }
                merged.push({ ...f, properties: { ...f.properties } });
                // Point는 lastTail 갱신하지 않음
                continue;
            }

            if (f.geometry.type === "LineString") {
                const coords = (f.geometry.coordinates ?? []) as [number, number][];
                if (!Array.isArray(coords) || coords.length === 0) continue;

                const fixed: [number, number][] = [];
                for (let i = 0; i < coords.length; i++) {
                    const c = coords[i];
                    if (!isFiniteNum(c?.[0]) || !isFiniteNum(c?.[1])) continue;

                    // 라인의 시작점이 직전 라인의 꼬리와 같으면 드롭
                    if (i === 0 && lastTail &&
                        Math.abs(lastTail[0] - c[0]) < EPS && Math.abs(lastTail[1] - c[1]) < EPS) {
                        continue;
                    }
                    pushIfNotDuplicate(fixed, c);
                }

                if (fixed.length === 0) continue;
                lastTail = fixed[fixed.length - 1]; // 새 꼬리 갱신

                merged.push({
                    ...f,
                    geometry: { type: "LineString", coordinates: fixed },
                    properties: { ...f.properties },
                });
            }
        }
    }

    // 일괄 재인덱싱 (0..N-1)
    for (let i = 0; i < merged.length; i++) {
        merged[i] = { ...merged[i], properties: { ...merged[i].properties, index: i } };
    }
    return { type: "FeatureCollection", features: merged };
}

/**
 * 좌표 배열([lng,lat][])을 받아
 * "시작 + 최대 5 경유 + 끝" 배치로 호출 → 병합
 */
export async function getPedestrianResponse(
    coordinates: [number, number][]
): Promise<PedestrianResponse> {
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
        return { type: "FeatureCollection", features: [] };
    }

    // 인접 동일 좌표 제거
    const anchors: [number, number][] = [];
    for (const c of coordinates) {
        if (isFiniteNum(c?.[0]) && isFiniteNum(c?.[1])) pushIfNotDuplicate(anchors, c);
    }
    if (anchors.length < 2) return { type: "FeatureCollection", features: [] };

    const tasks: Promise<PedestrianResponse>[] = [];

    // 배치: start + 최대 5 경유 + end
    let i = 0;
    while (i < anchors.length - 1) {
        const remaining = anchors.length - 1 - i; // 최소 1
        const viaCount = Math.min(5, Math.max(0, remaining - 1)); // 경유지 개수
        const endIdx = i + viaCount + 1;

        const [startX, startY] = anchors[i];
        const [endX, endY] = anchors[endIdx];

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
        i = endIdx;
    }

    // Promise.all은 tasks 배열 **순서대로** 결과를 반환합니다.
    const responses = await Promise.all(tasks);
    return mergeAndRenumber(responses);
}
