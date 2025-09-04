import * as Cesium from "cesium";
import type { Viewer } from "cesium";

declare global {
    interface Window {
        Cesium: typeof Cesium;
        viewer?: Viewer;
    }
}

Cesium.Ion.defaultAccessToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN as string;

export function createCesium(container: HTMLElement): Viewer {
    if (typeof window !== "undefined") window.Cesium = Cesium;

    const hiddenCreditContainer = document.createElement("div");


    const viewer = new Cesium.Viewer(container, {
        animation: false,
        timeline: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        selectionIndicator: false,
        infoBox: false,
        vrButton: false,

        // 크레딧 비표시(선택)
        creditContainer: hiddenCreditContainer,
    });

    // resize 가드
    const originalResize = viewer.resize.bind(viewer);
    viewer.resize = () => {
        try {
            if (!viewer.isDestroyed()) originalResize();
        } catch { /* no-op */ }
    };

    window.viewer = viewer;
    return viewer;
}

/** Viewer의 재생 루프/resize를 제어하기 위한 보조 타입 (any 금지) */
type MutableViewer = Viewer & {
    useDefaultRenderLoop?: boolean; // 일부 타입 정의에서 optional일 수 있어 optional 처리
    resize: () => void;
};

export function destroyCesium(v?: Viewer) {
    const viewer = v ?? window.viewer;
    if (!viewer) return;

    const mv = viewer as MutableViewer;

    try {
        // 1) 기본 렌더 루프 중지
        mv.useDefaultRenderLoop = false;
    } catch { /* no-op */ }

    try {
        // 2) 파괴 직전 resize 호출 무력화
        mv.resize = () => {};
    } catch { /* no-op */ }

    try {
        if (!viewer.isDestroyed()) viewer.destroy();
    } catch { /* swallow DeveloperError after destroy */ }

    if (!v && window.viewer === viewer) window.viewer = undefined;
}

/**
 * - window.resize + ResizeObserver 이벤트에서 viewer.resize를 호출
 * - cleanup 시 즉시 분리
 */
export function enableAutoResize(viewer: Viewer, element: HTMLElement) {
    let alive = true;

    const onWindow = () => {
        if (!alive) return;
        if (!viewer.isDestroyed()) viewer.resize();
    };
    window.addEventListener("resize", onWindow);

    const ro = new ResizeObserver(() => {
        if (!alive) return;
        if (!viewer.isDestroyed()) viewer.resize();
    });
    ro.observe(element);

    return () => {
        alive = false;
        window.removeEventListener("resize", onWindow);
        ro.disconnect();
    };
}
