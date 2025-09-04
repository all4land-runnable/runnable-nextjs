import getViewer from "@/app/components/templates/cesium/util/getViewer";

export default function requestRender() {
    getViewer().scene.requestRender?.();
}