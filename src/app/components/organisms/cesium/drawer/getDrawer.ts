import Drawer from "@cesium-extends/drawer";
import getViewer from "../util/getViewer";

/** 전역 Drawer 가져오기 (없으면 생성) */
export default function getDrawer() {
    const viewer = getViewer();

    if(!window.drawer) {
        window.drawer = new Drawer(viewer, {
            tips: {
                init: "시작: 좌클릭",
                start: "이동: 드래그, 선택: 좌클릭, 제거: 우클릭, 종료: 더블클릭",
                end: "",
            }
        });
    }

    return window.drawer;
}
