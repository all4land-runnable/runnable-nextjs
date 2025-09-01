import { getViewer } from "@/app/components/templates/cesium/viewer/getViewer";
import * as Cesium from "cesium";

/**
 * 특정 id의 마커를 제거하는 함수이다.
 *
 * @param entities 삭제할 엔티티 모음
 */
export default async function clearMarkers(entities: Cesium.Entity[]) {
    const viewer = await getViewer();

    entities.forEach(entity => {viewer.entities.remove(entity);})
    entities.length = 0 // 베열 초기화

    viewer.scene.requestRender?.(); // 실시간으로 렌더링 한다.
}