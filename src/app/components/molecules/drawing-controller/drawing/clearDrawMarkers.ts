import {getViewer} from "@/app/components/templates/cesium/viewer/getViewer";
import {removeDrawPolyline} from "@/app/components/molecules/drawing-controller/drawing/drawingRoute";

/**
 * 모든 draw_marker_${i} 마커를 제거하는 함수이다.
 */
export async function clearDrawMarkers() {
    const viewer = await getViewer();

    // 모든 entity를 순회하면서
    viewer.entities.values.forEach(entity => {
        // 만약 id가 draw_marker_${id}라면,
        if (/^draw_marker_\d+$/.test(entity.id))
            viewer.entities.remove(entity) // 엔티티를 제거한다.
    })

    await removeDrawPolyline(); // Polyline도 제거한다.

    viewer.scene.requestRender?.(); // 실시간으로 렌더링 한다.
}