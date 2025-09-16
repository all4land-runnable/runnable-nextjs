import {getSidewalkDS} from "@/app/staticVariables";
import requestRender from "@/app/components/organisms/cesium/util/requestRender";

/** 2) 버튼 클릭 시 호출: show만 토글 */
export function toggleSidewalkVisible() {
    const sidewalkDS = getSidewalkDS();

    sidewalkDS.show = !sidewalkDS.show;

    requestRender()
}
