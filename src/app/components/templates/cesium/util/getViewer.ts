export default function getViewer() {
    if (!window.viewer) {
        throw new Error("Cesium Viewer tempRoute not found.");
    }
    return window.viewer;
}