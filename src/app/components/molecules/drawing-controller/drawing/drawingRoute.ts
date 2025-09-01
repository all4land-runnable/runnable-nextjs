import * as Cesium from "cesium";
import { Cartesian3 } from "cesium";
import upsertDrawMarkers from "@/app/utils/markers/upsertDrawMarkers";
import { getViewer } from "@/app/components/templates/cesium/viewer/getViewer";
import { getDrawer } from "@/app/components/templates/cesium/drawer/getDrawer";
import calcDistance from "@/app/utils/claculator/calcDistance";

let draw_polyline: string = "";

export default async function drawingRoute(
    onEnd: (entity: Cesium.Entity, positions: Cartesian3[]) => void
) {
    const viewer = await getViewer();
    const drawer = await getDrawer();

    drawer.start({
        type: "POLYLINE",
        once: true,
        finalOptions: {
            width: 8,
            material: Cesium.Color.RED,
            clampToGround: true,
        },
        onPointsChange: (points) => {
            const distance = calcDistance(points);
            // ✅ viewer를 직접 전달: 불필요한 await 제거로 즉시 반영
            upsertDrawMarkers(viewer, points, distance);
            viewer.scene.requestRender?.();
        },
        onEnd: (entity, positions) => {
            draw_polyline = entity.id;
            onEnd(entity, positions);
        },
    });
}

export async function removeDrawPolyline() {
    const viewer = await getViewer();
    viewer.entities.removeById(draw_polyline);
}
