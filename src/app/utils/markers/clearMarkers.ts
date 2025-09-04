import * as Cesium from "cesium";
import getViewer from "@/app/components/templates/cesium/util/getViewer";
import requestRender from "@/app/components/templates/cesium/util/requestRender";

/**
 * 특정 id의 마커를 제거하는 함수이다.
 *
 * @param entities 삭제할 엔티티 모음
 */
export default function clearMarkers(entities: Cesium.Entity[]) {
    const viewer = getViewer()

    entities.forEach(entity => {viewer.entities.remove(entity);})
    entities.length = 0 // 베열 초기화

    requestRender();
}