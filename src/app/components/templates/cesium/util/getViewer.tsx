export default function getViewer() {
    if (!window.viewer) {
        throw new Error("Cesium Viewer has not been initialized yet.");
    }
    return window.viewer;
}