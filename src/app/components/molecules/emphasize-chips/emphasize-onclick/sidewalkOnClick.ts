import {getCameraPosition, getViewer} from "@/app/components/templates/cesium/viewer/getViewer";
import {initSidewalkLayer, sidewalkDS} from "@/app/components/templates/cesium/initSidewalkLayer";

export async function sidewalkOnClick() {
    await toggleSidewalkVisible();
}

/** 2) 버튼 클릭 시 호출: show만 토글 */
export async function toggleSidewalkVisible(force?: boolean) {
    // TODO: 용량이 너무 커서 잠시 막아둠
    alert("최적화 문제로 잠시 막아둠")

    const viewer = await getViewer();

    // 안전장치: 아직 안 불러졌으면 자동 초기화
    if (!sidewalkDS) await initSidewalkLayer();

    if (!sidewalkDS) return; // (로드 실패 방어)

    sidewalkDS.show = typeof force === "boolean" ? force : !sidewalkDS.show;

    // (선택) 즉시 리렌더
    viewer.scene.requestRender?.();
}
