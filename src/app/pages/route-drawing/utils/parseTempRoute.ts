// src/app/pages/route-drawing/utils/parseTempRoute.ts
import * as Cesium from "cesium";
import { Entity, JulianDate, Cartesian3, Cartographic, EllipsoidGeodesic } from "cesium";
import { Point, Route, Section } from "@/type/route";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";
import {calcHeight} from "@/app/pages/route-drawing/utils/calcHeight";

/**
 * - 마커(Entity) 배열을 이용해 경로를 구성
 * - 각 세그먼트를 **50m 이하 간격**으로 분할하여 terrain 고도 샘플링
 * - 섹션은 "인접 클릭 지점" 단위, 섹션 안의 points 는 촘촘한 샘플(글로벌 누적거리 기준)
 */
export async function parseTempRoute(tempMarkers: Entity[]): Promise<Route> {
    const title = "";
    const description = "";
    const viewer = getViewer();

    const isFiniteCartesian3 = (c?: Cartesian3): c is Cartesian3 =>
        !!c && Number.isFinite(c.x) && Number.isFinite(c.y) && Number.isFinite(c.z);

    const time: JulianDate = Cesium.JulianDate.now();
    const positions: Cartesian3[] = (tempMarkers ?? [])
        .map((e) => e.position?.getValue?.(time) as Cartesian3 | undefined)
        .filter(isFiniteCartesian3);

    if (positions.length < 2) {
        return { title, description, distance: 0, pace: 0, highHeight: 0, lowHeight: 0, sections: [] };
    }

    // 1) 클릭 지점 → Cartographic (라디안/미터)
    const endpoints: Cartographic[] = positions.map((p) =>
        Cesium.Cartographic.fromCartesian(p, Cesium.Ellipsoid.WGS84)
    );

    // 2) 각 세그먼트를 **≤50m** 간격으로 분할하여 전구간 샘플 배열 만들기
    const geod = new EllipsoidGeodesic();
    const globalSamples: Cartographic[] = [];
    const endpointSampleIndex: number[] = new Array(endpoints.length);

    const STEP = 50; // ✅ 요청: 50m
    for (let i = 0; i < endpoints.length - 1; i++) {
        const c0 = endpoints[i];
        const c1 = endpoints[i + 1];

        geod.setEndPoints(c0, c1);
        const segLen = geod.surfaceDistance;        // m
        const n = Math.max(1, Math.ceil(segLen / STEP));

        const startIndex = globalSamples.length;

        for (let j = 0; j <= n; j++) {
            if (i > 0 && j === 0) continue;           // 경계 중복 제거
            const f = j / n;
            const p = geod.interpolateUsingFraction(f);
            p.height = 0;                              // terrain으로 채움
            globalSamples.push(p);
        }

        const endIndex = globalSamples.length - 1;
        if (typeof endpointSampleIndex[i] !== "number") endpointSampleIndex[i] = startIndex;
        endpointSampleIndex[i + 1] = endIndex;
    }

    // 3) Terrain 고도 채우기
    const filled = await Cesium.sampleTerrainMostDetailed(
        viewer.terrainProvider,
        globalSamples
    ); // in-place

    // 4) 글로벌 누적 수평거리 + 최고/최저 구하기
    const reuseGeod = new EllipsoidGeodesic();
    const toDeg = Cesium.Math.toDegrees;

    let globalCum = 0;
    let high = Number.NEGATIVE_INFINITY;
    let low  = Number.POSITIVE_INFINITY;

    // 전구간 최고/최저 (샘플 기준이 더 정확)
    for (const s of filled) {
        const h = s.height ?? 0;
        if (h > high) high = h;
        if (h < low)  low  = h;
    }

    // 5) 섹션 구축: 각 세그먼트 샘플들을 섹션 포인트로 매핑
    const sections: Section[] = [];
    for (let i = 0; i < endpoints.length - 1; i++) {
        const sIdx = endpointSampleIndex[i];
        const eIdx = endpointSampleIndex[i + 1];

        const secPoints: Point[] = [];
        let secHoriz = 0;

        for (let k = sIdx; k <= eIdx; k++) {
            if (k > sIdx) {
                reuseGeod.setEndPoints(filled[k - 1], filled[k]);
                const d = reuseGeod.surfaceDistance || 0;
                secHoriz += d;
                globalCum += d;
            }

            const c = filled[k];
            secPoints.push({
                index: k, // 전역 샘플 인덱스를 그대로 써도 무방
                latitude: toDeg(c.latitude),
                longitude: toDeg(c.longitude),
                height: Math.round(c.height ?? 0),
                distance: Math.round(globalCum), // ✅ 전구간 누적거리
            });
        }

        // 섹션 평균 경사(%) = (종점고도-시점고도)/수평거리 * 100
        const dh = (secPoints.at(-1)?.height ?? 0) - (secPoints[0]?.height ?? 0);
        const slopePct = secHoriz > 0 ? (dh / secHoriz) * 100 : 0;

        sections.push({
            distance: Math.round(secHoriz),
            slope: Number(slopePct.toFixed(2)),
            pace: 0,
            startPlace: "",
            strategies: [],
            points: secPoints,
        });
    }

    const totalDistance = sections.reduce((acc, s) => acc + s.distance, 0);

    const route = {
        title,
        description,
        distance: totalDistance,
        pace: 0,
        highHeight: high === Number.NEGATIVE_INFINITY ? 0 : Math.round(high),
        lowHeight:  low  === Number.POSITIVE_INFINITY ? 0 : Math.round(low),
        sections,
    }

    await calcHeight(route)

    return route;
}
