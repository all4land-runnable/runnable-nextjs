// src/app/pages/route-drawing/utils/parsePedestrianRoute.ts
import * as Cesium from "cesium";
import { Entity, JulianDate, Cartesian3 } from "cesium";
import type { Route, Section, Point } from "@/type/route";
import type { PedestrianResponse, Feature } from "@/api/response/pedestrianResponse";
import {calcHeight} from "@/app/pages/route-drawing/utils/calcHeight";
import {EPS, isFiniteNum, toRad} from "@/app/pages/route-drawing/utils/pushIfNotDuplicate";

/** 하버사인: [lng,lat] in degrees */
function geoDistanceMeters(a: [number, number], b: [number, number]): number {
    const R = 6378137;
    const [lng1, lat1] = a;
    const [lng2, lat2] = b;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const la1 = toRad(lat1), la2 = toRad(lat2);
    const s = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;
    return R * (2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)));
}

function pushIfNotDuplicate(acc: [number, number][], c: [number, number]) {
    if (acc.length === 0) { acc.push(c); return; }
    const [plng, plat] = acc[acc.length - 1];
    const [clng, clat] = c;
    if (Math.abs(plng - clng) > EPS || Math.abs(plat - clat) > EPS) acc.push(c);
}

function pickSectionName(line: Feature, prevPoint?: Feature): string {
    const p = prevPoint?.properties;
    const fromPoint =
        p?.nearPoiName?.trim() ||
        p?.facilityName?.trim() ||
        p?.intersectionName?.trim() ||
        p?.description?.trim();
    if (fromPoint) return fromPoint;
    return line.properties?.description?.trim() || "";
}

export async function parsePedestrianRoute(
    pedestrianEntity: Entity,
    pedestrianResponse: PedestrianResponse
): Promise<Route> {
    const title = "";
    const description = "";

    // positions
    const poly = pedestrianEntity.polyline;
    const positionsProp = poly?.positions as
        | Cartesian3[]
        | { getValue: (t?: JulianDate) => Cartesian3[] | undefined }
        | undefined;

    const time: JulianDate = Cesium.JulianDate.now();
    let positions: Cartesian3[] | undefined;
    if (Array.isArray(positionsProp)) positions = positionsProp;
    else if (positionsProp && typeof (positionsProp).getValue === "function")
        positions = (positionsProp as { getValue: (t?: JulianDate) => Cartesian3[] | undefined }).getValue(time);

    if (!positions || positions.length < 2) {
        return { title, description, distance: 0, pace: 0, highHeight: 0, lowHeight: 0, sections: [] };
    }

    // positions → Cartographic(deg 변환)
    const ell = Cesium.Ellipsoid.WGS84;
    const toDeg = Cesium.Math.toDegrees;
    const cartos = positions.map(p => Cesium.Cartographic.fromCartesian(p, ell));

    // features 정렬
    const sorted = [...(pedestrianResponse?.features ?? [])].sort(
        (a, b) => (a.properties?.index ?? 0) - (b.properties?.index ?? 0)
    );

    const sections: Section[] = [];
    let globalCum = 0;
    let globalPointIdx = 0;
    let cartoCursor = 0;
    let high = Number.NEGATIVE_INFINITY;
    let low  = Number.POSITIVE_INFINITY;

    let prevPointFeature: Feature | undefined;
    let lastTail: [number, number] | undefined;

    for (const f of sorted) {
        if (!f?.geometry) continue;

        if (f.geometry.type === "Point") {
            prevPointFeature = f;
            continue;
        }
        if (f.geometry.type !== "LineString") continue;

        // LineString 좌표(경도,위도 in deg) + 연결부 중복 제거
        const raw = (f.geometry.coordinates ?? []) as [number, number][];
        if (!Array.isArray(raw) || raw.length === 0) continue;

        const coords: [number, number][] = [];
        for (let i = 0; i < raw.length; i++) {
            const c = raw[i];
            if (!isFiniteNum(c?.[0]) || !isFiniteNum(c?.[1])) continue;
            if (i === 0 && lastTail &&
                Math.abs(lastTail[0] - c[0]) < EPS && Math.abs(lastTail[1] - c[1]) < EPS) continue;
            pushIfNotDuplicate(coords, c);
        }
        if (coords.length === 0) continue;
        lastTail = coords[coords.length - 1];

        // Section.points 구성 (Entity Cartographic → height/lat/lon **deg**, 누적은 geoDistanceMeters)
        const secPoints: Point[] = [];
        let secCum = 0;

        // 첫 점
        {
            const carto = cartos[cartoCursor] ?? ({ latitude: 0, longitude: 0, height: 0 } as Cesium.Cartographic);
            const h = Number.isFinite(carto.height) ? carto.height : 0;
            high = Math.max(high, h);
            low  = Math.min(low,  h);

            secPoints.push({
                index: globalPointIdx++,
                latitude: toDeg(carto.latitude),
                longitude: toDeg(carto.longitude),
                height: h,
                distance: globalCum,
            });
            cartoCursor++;
        }

        // 나머지 점들
        for (let i = 1; i < coords.length; i++) {
            const horiz = geoDistanceMeters(coords[i - 1], coords[i]);
            secCum += horiz;
            globalCum += horiz;

            const carto = cartos[cartoCursor] ?? ({ latitude: 0, longitude: 0, height: 0 } as Cesium.Cartographic);
            const h = Number.isFinite(carto.height) ? carto.height : 0;
            high = Math.max(high, h);
            low  = Math.min(low,  h);

            secPoints.push({
                index: globalPointIdx++,
                latitude: toDeg(carto.latitude),
                longitude: toDeg(carto.longitude),
                height: h,
                distance: globalCum,
            });
            cartoCursor++;
        }

        // 섹션 메트릭
        const secDistance = secCum;
        const first = secPoints[0];
        const last  = secPoints[secPoints.length - 1];
        const deltaH = (last?.height ?? 0) - (first?.height ?? 0);
        const slopePct = secDistance > 0 ? (deltaH / secDistance) * 100 : 0;

        const startPlace = pickSectionName(f, prevPointFeature);

        sections.push({
            distance: Math.round(secDistance),
            slope: Number(slopePct.toFixed(2)),
            pace: 0,
            startPlace,
            strategies: [],
            points: secPoints,
        });

        prevPointFeature = undefined;
    }

    const totalDistance = Math.round(globalCum);

    const route = {
        title,
        description,
        distance: totalDistance,
        pace: 0,
        highHeight: high === Number.NEGATIVE_INFINITY ? 0 : high,
        lowHeight:  low  === Number.POSITIVE_INFINITY ? 0 : low,
        sections,
    };

    await calcHeight(route);

    return route;
}
