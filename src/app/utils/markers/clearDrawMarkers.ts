import {getViewer} from "@/app/components/templates/cesium/viewer/getViewer";
import * as Cesium from "cesium";
import {removeDrawPolyline} from "@/app/components/molecules/drawing-controller/drawing/drawingRoute";

/** draw_marker_${i} 형태의 모든 마커 엔티티 제거 */
export async function clearDrawMarkers(): Promise<number> {
    const viewer = await getViewer();

    // 먼저 지울 대상만 모아두고, 그 다음 일괄 제거 (순회 중 컬렉션 변형 방지)
    const toRemove: Cesium.Entity[] = [];
    for (const e of viewer.entities.values) {
        if (/^draw_marker_\d+$/.test(e.id)) {
            toRemove.push(e);
        }
    }

    toRemove.forEach((e) => viewer.entities.remove(e));
    viewer.scene.requestRender?.();

    // 기존 엔티티 제거
    await removeDrawPolyline();

    return toRemove.length; // 지운 개수 반환 (선택)
}