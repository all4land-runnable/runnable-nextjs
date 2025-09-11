// src/app/pages/route-drawing/utils/getPedestrianRoute.ts
import * as Cesium from "cesium";
import { Entity } from "cesium";
import apiClient from "@/api/apiClient";
import { PedestrianResponse, Feature } from "@/api/response/pedestrianResponse";
import { Route, Section, Point as RPoint } from "@/type/route";

const EPS = 1e-12;
const toRad = (deg: number) => (deg * Math.PI) / 180;

function pushIfNotDuplicate(acc: [number, number][], c: [number, number]) {
    if (acc.length === 0) { acc.push(c); return; }
    const [plng, plat] = acc[acc.length - 1];
    const [clng, clat] = c;
    if (Math.abs(plng - clng) > EPS || Math.abs(plat - clat) > EPS) acc.push(c);
}

function geoDistanceMeters(a: [number, number], b: [number, number]): number {
    const R = 6378137; // WGS84
    const [lng1, lat1] = a;
    const [lng2, lat2] = b;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const la1 = toRad(lat1), la2 = toRad(lat2);
    const s =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)));
}

// tempRoute → 앵커(클릭 지점) 복원
function anchorsFromTempRoute(tempRoute: Route, isCircular: boolean): [number, number][] {
    if (!tempRoute?.sections?.length) return [];
    const anchors: [number, number][] = [];
    const firstStart = tempRoute.sections[0]?.points?.[0];
    if (!firstStart) return anchors;
    anchors.push([firstStart.longitude, firstStart.latitude]);
    for (const s of tempRoute.sections) {
        const end = s.points?.[1];
        if (end) anchors.push([end.longitude, end.latitude]);
    }
    if (isCircular && anchors.length > 0) anchors.push(anchors[0]);
    return anchors;
}

// 라인 섹션 라벨: nearPoiName → facilityName → intersectionName → description
function pickSectionName(line: Feature, prevPoint?: Feature): string {
    const p = prevPoint?.properties;
    const fromPoint =
        p?.nearPoiName?.trim() ||
        p?.facilityName?.trim() ||
        p?.intersectionName?.trim() ||
        p?.description?.trim();
    if (fromPoint) return fromPoint;

    const lf = line.properties;
    const fromLine = lf?.description?.trim(); // LineString.name은 종종 없음
    if (fromLine) return fromLine;

    return "";
}

// 모든 응답 합치기
function mergeFeatures(responses: PedestrianResponse[]): Feature[] {
    const merged: Feature[] = [];
    for (const r of responses) {
        if (!r?.features) continue;
        merged.push(...r.features);
    }
    return merged.sort((a, b) => (a.properties?.index ?? 0) - (b.properties?.index ?? 0));
}

// 렌더용: Point + LineString 좌표 평탄화
function flattenAllCoordinates(features: Feature[]): [number, number][] {
    const sorted = [...(features ?? [])].sort(
        (a, b) => (a.properties?.index ?? 0) - (b.properties?.index ?? 0)
    );
    const coords: [number, number][] = [];
    for (const f of sorted) {
        if (!f.geometry) continue;
        if (f.geometry.type === "Point") {
            const pt = f.geometry.coordinates as [number, number];
            if (Number.isFinite(pt?.[0]) && Number.isFinite(pt?.[1])) pushIfNotDuplicate(coords, pt);
        } else if (f.geometry.type === "LineString") {
            const line = f.geometry.coordinates as [number, number][];
            if (Array.isArray(line)) {
                for (const c of line) {
                    if (Number.isFinite(c?.[0]) && Number.isFinite(c?.[1])) pushIfNotDuplicate(coords, c);
                }
            }
        }
    }
    return coords;
}

// 배치 호출(시작 + 최대 5 경유 + 끝)
async function fetchPedestrianSegment(params: {
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

// LineString → Section
function lineStringToSection(
    lineFeature: Feature,
    prevPoint: Feature | undefined,
    pointIndexOffset: number
): { section: Section; lastPointIndex: number; distance: number } {
    const coords = (lineFeature.geometry).coordinates as [number, number][];
    const name = pickSectionName(lineFeature, prevPoint);

    const points: RPoint[] = [];
    let cumulative = 0;
    for (let i = 0; i < coords.length; i++) {
        if (i > 0) cumulative += geoDistanceMeters(coords[i - 1], coords[i]);
        const [lng, lat] = coords[i];
        points.push({
            index: pointIndexOffset + i,
            latitude: lat,
            longitude: lng,
            height: 0,              // <- 초기값(후에 보강)
            distance: Math.round(cumulative), // 섹션 기준 누적 수평거리
        });
    }

    const sectionDistance =
        coords.length >= 2
            ? coords.slice(1).reduce((acc, _, i) => acc + geoDistanceMeters(coords[i], coords[i + 1]), 0)
            : 0;

    const section: Section = {
        distance: Math.round(sectionDistance),
        slope: 0,          // <- 초기값(후에 보강: Δh / Δ수평거리)
        pace: 0,
        startPlace: name,
        strategies: name,
        points,
    };
    return { section, lastPointIndex: pointIndexOffset + Math.max(0, coords.length - 1), distance: sectionDistance };
}

// Features → Route
function buildRouteFromFeatures(features: Feature[]): Route {
    const sorted = mergeFeatures([{ type: "FeatureCollection", features }]);
    let prevPoint: Feature | undefined;
    const sections: Section[] = [];
    let globalIdx = 0;
    let total = 0;

    for (const f of sorted) {
        if (!f.geometry) continue;
        if (f.geometry.type === "Point") {
            prevPoint = f;
            continue;
        }
        if (f.geometry.type !== "LineString") continue;

        const { section, lastPointIndex, distance } = lineStringToSection(f, prevPoint, globalIdx);
        sections.push(section);
        globalIdx = lastPointIndex + 1;
        total += distance;

        // 라인 뒤에는 그 라인의 마지막 점이 “현재 위치”가 되므로
        prevPoint = undefined;
    }

    return {
        title: "",
        description: "",
        distance: Math.round(total),
        pace: 0,
        highHeight: 0,
        lowHeight: 0,
        sections,
    };
}

// 선택: 지형 샘플링으로 height 보강 → slope 계산
async function enrichHeightsAndSlopes(route: Route, terrainProvider?: Cesium.TerrainProvider): Promise<void> {
    if (!terrainProvider) return;

    // 모든 포인트를 모아 Cartographic로
    const allPoints = route.sections.flatMap(s => s.points);
    if (allPoints.length === 0) return;

    const cartos = allPoints.map(p => Cesium.Cartographic.fromDegrees(p.longitude, p.latitude));
    try {
        const detailed = await Cesium.sampleTerrainMostDetailed(terrainProvider, cartos);
        // height 채우기
        for (let i = 0; i < allPoints.length; i++) {
            const h = detailed[i]?.height;
            if (Number.isFinite(h)) allPoints[i].height = h!;
        }
        // 섹션별 slope 갱신: (Δh / Δ수평거리)
        for (const s of route.sections) {
            if (s.points.length < 2) { s.slope = 0; continue; }
            let totalSlopeNumer = 0;
            let totalHoriz = 0;
            for (let i = 1; i < s.points.length; i++) {
                const a = s.points[i - 1];
                const b = s.points[i];
                const dh = (b.height ?? 0) - (a.height ?? 0);
                const horiz = geoDistanceMeters([a.longitude, a.latitude], [b.longitude, b.latitude]);
                if (horiz > 0) {
                    totalSlopeNumer += dh;
                    totalHoriz += horiz;
                }
            }
            s.slope = totalHoriz > 0 ? Number(((totalSlopeNumer / totalHoriz) * 100).toFixed(2)) : 0;
        }

        // 고도 통계
        const hs = allPoints.map(p => p.height ?? 0);
        route.highHeight = hs.length ? Math.max(...hs) : 0;
        route.lowHeight  = hs.length ? Math.min(...hs) : 0;
    } catch {
        // 샘플링 실패 시 조용히 패스 (slope, height=0 유지)
    }
}

// Entity 생성(렌더용 전체 좌표)
function makePedestrianEntityFromCoords(coords: [number, number][]): Entity {
    const positions = Cesium.Cartesian3.fromDegreesArray(coords.flat());
    return new Cesium.Entity({
        id:"pedestrian_entity",
        polyline: {
            positions,
            width: 5,
            material: Cesium.Color.fromCssColorString("#4D7C0F"),
            clampToGround: true,
        },
    });
}

// ====== 메인 ======
/**
 * tempRoute(클릭 지점 기반) → [pedestrianEntity, pedestrianRoute]
 * - Tmap을 start+(최대 5 경유)+end 배치로 호출
 * - LineString Feature → Section, coordinates → Point[]
 * - section.startPlace: nearPoiName → facilityName → intersectionName → description
 * - height/slope: terrainProvider 제공 시 보강 (없으면 0/0 유지)
 */
export async function getPedestrianRoute(
    tempRoute: Route,
    opts?: { isCircular?: boolean; terrainProvider?: Cesium.TerrainProvider }
): Promise<[Entity, Route]> {
    const isCircular = !!opts?.isCircular;
    const markers = anchorsFromTempRoute(tempRoute, isCircular);

    // 5개 단위로 호출
    const tasks: Promise<PedestrianResponse>[] = [];
    for (let i = 0; i < markers.length - 1; i += 5) {
        const [startX, startY] = markers[i];
        const remaining = markers.length - (i + 1);
        const stepCount = Math.min(5, remaining);

        const passListCoords: string[] = [];
        for (let j = 1; j < stepCount; j++) {
            const [viaX, viaY] = markers[i + j];
            passListCoords.push(`${viaX},${viaY}`);
        }
        const passList = passListCoords.length ? passListCoords.join("_") : undefined;
        const [endX, endY] = markers[i + stepCount];

        tasks.push(fetchPedestrianSegment({ startX, startY, endX, endY, passList }));
    }

    const responses = await Promise.all(tasks);
    const features = mergeFeatures(responses);

    // 렌더용 전체 좌표 → Entity
    const coords = flattenAllCoordinates(features);
    const pedestrianEntity = makePedestrianEntityFromCoords(coords);

    // Route 구성
    const pedestrianRoute = buildRouteFromFeatures(features);

    // (선택) 고도/경사 보강
    if (opts?.terrainProvider) {
        await enrichHeightsAndSlopes(pedestrianRoute, opts.terrainProvider);
    }

    return [pedestrianEntity, pedestrianRoute];
}
