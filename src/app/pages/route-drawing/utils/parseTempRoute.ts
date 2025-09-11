// src/app/pages/route-drawing/utils/parseTempRoute.ts
import * as Cesium from "cesium";
import { Entity, EllipsoidGeodesic, JulianDate, Cartesian3 } from "cesium";
import { Point, Route, Section } from "@/type/route";

/**
 * Drawer로 만들어진 LineString(마커 배열)에서
 * Route 구조로 파싱합니다.
 *
 * - 인접 클릭 지점 쌍이 Section 하나
 * - section.points = [start, end]
 * - 거리: WGS84 지표면 거리(m)
 * - 경사: (고도차 / 수평거리) * 100 (%)
 */
export function parseTempRoute(tempMarkers: Entity[]): Route {
    const title = "";
    const description = "";

    const isFiniteCartesian3 = (c?: Cartesian3): c is Cartesian3 =>
        !!c && Number.isFinite(c.x) && Number.isFinite(c.y) && Number.isFinite(c.z);

    // 호출 시점 스냅샷(정적 배열) 생성
    const time: JulianDate = Cesium.JulianDate.now();
    const positions: Cartesian3[] = (tempMarkers ?? [])
        .map((e) => e.position?.getValue?.(time) as Cartesian3 | undefined)
        .filter(isFiniteCartesian3);

    if (positions.length < 2) {
        return {
            title,
            description,
            distance: 0,
            pace: 0,
            highHeight: 0,
            lowHeight: 0,
            sections: [],
        };
    }

    // Cartesian3 -> Cartographic
    const cartos = positions.map((p) =>
        Cesium.Ellipsoid.WGS84.cartesianToCartographic(p)
    );

    const toDeg = Cesium.Math.toDegrees;
    const geodesic = new EllipsoidGeodesic();
    const points: Point[] = [];
    const sections: Section[] = [];

    let cumulative = 0;
    let high = -Infinity;
    let low = +Infinity;

    // 포인트 생성(누적거리 포함)
    for (let i = 0; i < cartos.length; i++) {
        if (i > 0) {
            geodesic.setEndPoints(cartos[i - 1], cartos[i]);
            const d = geodesic.surfaceDistance || 0;
            cumulative += d;
        }

        const lat = toDeg(cartos[i].latitude);
        const lon = toDeg(cartos[i].longitude);
        const h = cartos[i].height ?? 0;

        if (h > high) high = h;
        if (h < low) low = h;

        points.push({
            index: i,
            latitude: lat,
            longitude: lon,
            height: h,
            distance: Math.round(cumulative),
        });
    }

    // 섹션 생성
    for (let i = 0; i < cartos.length - 1; i++) {
        const c1 = cartos[i];
        const c2 = cartos[i + 1];

        geodesic.setEndPoints(c1, c2);
        const horiz = geodesic.surfaceDistance || 0;
        const dh = (c2.height ?? 0) - (c1.height ?? 0);
        const slopePercent = horiz > 0 ? (dh / horiz) * 100 : 0;

        const pStart: Point = points[i];
        const pEnd: Point = points[i + 1];

        sections.push({
            distance: Math.round(horiz),
            slope: Number(slopePercent.toFixed(2)),
            pace: 0,
            startPlace: "",
            strategies: "",
            points: [pStart, pEnd],
        });
    }

    const totalDistance = sections.reduce((acc, s) => acc + s.distance, 0);

    return {
        title,
        description,
        distance: totalDistance,
        pace: 0,
        highHeight: high === -Infinity ? 0 : high,
        lowHeight: low === +Infinity ? 0 : low,
        sections,
    };
}
