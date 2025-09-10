import * as Cesium from "cesium";
import type { Cartesian3, Cartographic, JulianDate } from "cesium";
import type { Route } from "@/type/route";
import type { Section } from "@/type/section";
import type { Point } from "@/type/point";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";

/**
 * Entity(Polyline) 경로를 일정 간격(stepMeters)으로 분할해 terrain 고도를 샘플링하고,
 * 단일 섹션(전체 구간 1개)의 Route 도메인으로 반환한다.
 *
 * - points: SectionPoint[]  (index / lat / lon / height / distance(누적 m))
 * - section: 전체 구간 1개 (필요 시 이후 로직에서 분할 확장)
 * - slope: 평균 경사(%) = (종점고도-시점고도) / 수평거리 * 100
 */
export async function buildRouteFromEntity(
    entity: Cesium.Entity,
    stepMeters = 30
): Promise<Route> {
    const viewer = getViewer();

    // 1) 시간 스냅샷 (시변 Property를 동일 시점에서 평가)
    const time: JulianDate = viewer.clock?.currentTime ?? Cesium.JulianDate.now();

    // 2) Polyline 유효성 검사
    const poly = entity.polyline;
    if (!poly) return emptyRoute("Route", "");

    const positionsProp = poly.positions as unknown;

    // getValue 보유 여부만 판별하는 간단 가드
    const isPosProperty = (
        x: unknown
    ): x is { getValue: (time?: JulianDate) => Cartesian3[] | undefined } =>
        typeof x === "object" && x !== null && "getValue" in x &&
        typeof (x as { getValue: unknown }).getValue === "function";

    let positions: Cartesian3[] | undefined;
    if (Array.isArray(positionsProp)) {
        positions = positionsProp as Cartesian3[];
    } else if (isPosProperty(positionsProp)) {
        positions = positionsProp.getValue(time);
    }

    if (!positions || positions.length < 2) return emptyRoute("Route", "");

    // 3) 경로를 stepMeters 간격으로 지오데식 분할 (Cartographic 배열 생성)
    const samples: Cartographic[] = [];
    for (let i = 0; i + 1 < positions.length; i++) {
        const c0 = Cesium.Cartographic.fromCartesian(positions[i]);
        const c1 = Cesium.Cartographic.fromCartesian(positions[i + 1]);

        const geod = new Cesium.EllipsoidGeodesic(c0, c1);
        const segLen = geod.surfaceDistance;
        const n = Math.max(1, Math.ceil(segLen / stepMeters));

        for (let j = 0; j <= n; j++) {
            // 인접 세그먼트 경계점 중복 방지
            if (i > 0 && j === 0) continue;
            const f = j / n; // 0~1
            const p = geod.interpolateUsingFraction(f);
            p.height = 0; // terrain 샘플링으로 대체 예정
            samples.push(p);
        }
    }

    // 4) Terrain 고도 채우기
    //  - EllipsoidTerrainProvider 사용 시 height가 0 근처일 수 있음(실고도 아님)
    const filled = await Cesium.sampleTerrainMostDetailed(
        viewer.terrainProvider,
        samples
    );

    // 5) 누적거리/최고/최저/평균 경사 계산 + SectionPoint 변환
    const points: Point[] = [];
    let prev: Cartographic | null = null;
    let cumDist = 0;

    let minH = Number.POSITIVE_INFINITY;
    let maxH = Number.NEGATIVE_INFINITY;

    const first = filled[0];
    const last = filled[filled.length - 1];

    for (let idx = 0; idx < filled.length; idx++) {
        const c = filled[idx];

        // 누적 수평거리(지표거리)
        if (prev) {
            cumDist += new Cesium.EllipsoidGeodesic(prev, c).surfaceDistance;
        }

        const h = c.height ?? 0;
        if (h < minH) minH = h;
        if (h > maxH) maxH = h;

        points.push({
            index: idx,
            latitude: Cesium.Math.toDegrees(c.latitude),
            longitude: Cesium.Math.toDegrees(c.longitude),
            height: h,
            distance: cumDist, // ★ 각 포인트의 "누적거리(m)" 저장
        });

        prev = c;
    }

    const totalDistance = cumDist; // m
    const totalElevChange = (last?.height ?? 0) - (first?.height ?? 0);
    const avgSlopePct =
        totalDistance > 0 ? (totalElevChange / totalDistance) * 100 : 0;

    // 6) 단일 섹션 구성
    const section: Section = {
        distance: totalDistance,
        slope: avgSlopePct,
        points: points,
    };

    // 7) Route 반환
    const route: Route = {
        title:"Route",
        description:"",
        distance: totalDistance,
        highHeight: isFinite(maxH) ? maxH : 0,
        lowHeight: isFinite(minH) ? minH : 0,
        sections: [section],
    };

    return route;
}

// 헬퍼: 빈 Route
function emptyRoute(title = "Route", description = ""): Route {
    return {
        title,
        description,
        distance: 0,
        highHeight: 0,
        lowHeight: 0,
        sections: [
            {
                distance: 0,
                slope: 0,
                points: [],
            },
        ],
    };
}
