import Drawer from "@cesium-extends/drawer";
import { drawerStore } from "./drawerStore";
import {getViewer} from "@/app/components/templates/cesium/viewer/getViewer";

// Drawer 생성자 2번째 인자의 타입 추론(옵션 타입)
type DrawerOptions = ConstructorParameters<typeof Drawer>[1];

const defaultOptions: DrawerOptions = {
    tips: {
        init: "시작: 좌클릭",
        start: "이동: 드래그, 선택: 좌클릭, 제거: 우클릭, 종료: 더블클릭",
        end: "",
    },
    // terrain: true, // 지형 사용 시 필요하면 켜세요
};

/** 전역 Drawer 가져오기 (없으면 생성) */
export async function getDrawer(options?: DrawerOptions): Promise<Drawer> {
    const viewer = await getViewer();

    let drawer = drawerStore.get();
    if (!drawerStore.isAlive(drawer)) {
        drawer = new Drawer(viewer, { ...defaultOptions, ...(options ?? {}) });
        drawerStore.set(drawer);
    }
    return drawer;
}

/** 전역 Drawer 종료(pause) */
export async function pauseDrawer(): Promise<void> {
    const drawer = await getDrawer();
    drawer.pause();
}

/** 전역 Drawer 재설정(reset) */
export async function resetDrawer(): Promise<void> {
    const drawer = await getDrawer();
    drawer.reset();
}

/** 전역 Drawer 파기(destroy 유사) — 필요 시 사용 */
export async function destroyDrawer(): Promise<void> {
    const drawer = await getDrawer();
    drawer.destroy();
}
