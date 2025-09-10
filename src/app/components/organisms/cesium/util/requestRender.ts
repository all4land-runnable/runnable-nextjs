import getViewer from "@/app/components/organisms/cesium/util/getViewer";

export default function requestRender() {
    getViewer().scene.requestRender?.();
}