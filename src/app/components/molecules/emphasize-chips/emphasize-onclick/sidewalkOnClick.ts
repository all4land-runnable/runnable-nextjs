import getViewer from "@/app/components/templates/cesium/util/getViewer";
import {getSidewalkDS} from "@/app/staticVariables";

/** 2) 버튼 클릭 시 호출: show만 토글 */
export function toggleSidewalkVisible() {
    const viewer = getViewer();
    const sidewalkDS = getSidewalkDS();

    sidewalkDS.show = !sidewalkDS.show;

    viewer.scene.requestRender?.();
}
