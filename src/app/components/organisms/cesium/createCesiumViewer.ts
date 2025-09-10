import * as Cesium from "cesium";
import type { Viewer } from "cesium";

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