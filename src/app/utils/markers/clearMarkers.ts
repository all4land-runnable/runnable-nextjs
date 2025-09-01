import { getViewer } from "@/app/components/templates/cesium/viewer/getViewer";

/**
 * 특정 id의 마커를 제거하는 함수이다.
 *
 * @param preId 삭제할 마커의 id 앞부분
 */
export default async function clearMarkers(preId: string) {
    const viewer = await getViewer();

    // 접두어 뒤에 어떤 문자열이 와도 매치되도록(\d+ → .*)
    const regex = new RegExp(`^${preId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*$`);

    for (const entity of viewer.entities.values)
        if (regex.test(entity.id)) viewer.entities.remove(entity);

    viewer.scene.requestRender?.(); // 실시간으로 렌더링 한다.
}