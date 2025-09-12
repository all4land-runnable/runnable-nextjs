import clearMarkers from "@/app/utils/markers/clearMarkers";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";
import requestRender from "@/app/components/organisms/cesium/util/requestRender";
import {getPedestrianRouteMarkers, getTempEntity, getTempRouteMarkers} from "@/app/staticVariables";


/**
 * 기존에 그렸던 Polyline을 제거하는 함수
 */
export function removeTempRoute() {
    getViewer().entities.removeById(getTempEntity());

    const drawMarkerEntities = getTempRouteMarkers()
    clearMarkers(drawMarkerEntities) // 기존에 그려진 경로 마커들을 제거한다.

    requestRender()
}

export function removePedestrianRoute() {
    getViewer().entities.removeById("pedestrian_entity");

    const pedestrianRouteMarkers = getPedestrianRouteMarkers();
    clearMarkers(pedestrianRouteMarkers);

    requestRender()
}