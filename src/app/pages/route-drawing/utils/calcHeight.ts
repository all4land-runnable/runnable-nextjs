// src/app/pages/route-drawing/utils/enrichRouteHeights.ts
import * as Cesium from "cesium";
import type { Route } from "@/type/route";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";

/**
 * Route 내 모든 point의 (lon, lat)을 terrain으로 샘플링하여
 * point.height 만 채운다. (deg 기준)
 *
 * 사용 예:
 *   await enrichRouteHeights(route);
 */
export async function calcHeight(route: Route): Promise<void> {
    const viewer = getViewer();
    if (!route?.sections?.length) return;

    const points = route.sections.flatMap((s) => s.points);
    if (!points.length) return;

    // 각 포인트를 Cartographic(deg)로 변환
    const cartos = points.map((p) =>
        Cesium.Cartographic.fromDegrees(p.longitude, p.latitude)
    );

    try {
        const filled = await Cesium.sampleTerrainMostDetailed(
            viewer.terrainProvider,
            cartos
        );

        for (let i = 0; i < points.length; i++) {
            const h = filled[i]?.height;
            points[i].height = Number.isFinite(h) ? Math.round(h as number) : 0;
        }
    } catch {
        // terrain 미설정/에러 시 높이 0 유지
    }
}
