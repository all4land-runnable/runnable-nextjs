// src/app/pages/route-drawing/utils/parseTempRoute.ts
import * as Cesium from "cesium";
import { Entity, EllipsoidGeodesic, JulianDate, Cartesian3 } from "cesium";
import { Point, Route, Section } from "@/type/route";

export function parseTempRoute(tempMarkers: Entity[]): Route {
    const title = "";
    const description = "";

    const isFiniteCartesian3 = (c?: Cartesian3): c is Cartesian3 =>
        !!c && Number.isFinite(c.x) && Number.isFinite(c.y) && Number.isFinite(c.z);

    const time: JulianDate = Cesium.JulianDate.now();
    const positions: Cartesian3[] = (tempMarkers ?? [])
        .map((e) => e.position?.getValue?.(time) as Cartesian3 | undefined)
        .filter(isFiniteCartesian3);

    if (positions.length < 2) {
        return { title, description, distance: 0, pace: 0, highHeight: 0, lowHeight: 0, sections: [] };
    }

    const points: Point[] = [];
    const sections: Section[] = [];

    let sum = 0;
    let high = -Infinity;
    let low = +Infinity;

    const geod = new EllipsoidGeodesic();
    const toDeg = Cesium.Math.toDegrees;

    // 포인트(누적 수평거리 포함)
    for (let i = 0; i + 1 < positions.length; i++) {
        const start = Cesium.Cartographic.fromCartesian(positions[i]);
        const end = Cesium.Cartographic.fromCartesian(positions[i + 1]);

        geod.setEndPoints(start, end);
        const gap = geod.surfaceDistance || 0;

        if (start.height > high) high = start.height;
        if (start.height < low) low = start.height;

        points.push({
            index: i,
            latitude: toDeg(start.latitude),
            longitude: toDeg(start.longitude),
            height: start.height,
            distance: sum,
        });

        sum += gap;

        if (i + 1 === positions.length - 1) {
            if (end.height > high) high = end.height;
            if (end.height < low) low = end.height;

            points.push({
                index: i + 1,
                latitude: toDeg(end.latitude),
                longitude: toDeg(end.longitude),
                height: end.height,
                distance: sum,
            });
        }
    }

    // 섹션 생성
    for (let i = 0; i + 1 < points.length; i++) {
        const a = points[i];
        const b = points[i + 1];

        const distance = b.distance - a.distance;
        const slope = distance > 0 ? ((b.height - a.height) / distance) * 100 : 0;

        sections.push({
            distance,
            slope,
            pace: 0,
            startPlace: "",
            strategies: "",
            points: [a, b],
        });
    }

    const totalDistance = sections.reduce((s, section) => s + section.distance, 0);

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
