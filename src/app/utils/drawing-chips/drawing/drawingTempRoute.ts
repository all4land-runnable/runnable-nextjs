import * as Cesium from "cesium";
import {Cartesian3} from "cesium";
import clearMarkers from "@/app/utils/markers/clearMarkers";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";
import getDrawer from "@/app/components/organisms/cesium/drawer/getDrawer";
import requestRender from "@/app/components/organisms/cesium/util/requestRender";
import {getTempEntity, getTempRouteMarkers, setTempEntity} from "@/app/staticVariables";
import upsertTempRoute from "@/app/utils/drawing-chips/drawing/upsertTempRoute";

/**
 * 경로를 제작할 때 실행되는 함수이다.
 *
 * @param onEnd 경로 그리기가 끝나고 발생하는 이벤트 리스너
 */
export default async function drawingTempRoute(
    onEnd: (entity: Cesium.Entity, positions: Cartesian3[]) => void
) {
    const viewer = getViewer();
    const drawer = getDrawer();

    // 그리기 시작
    drawer.start({
        type: "POLYLINE",
        once: true, // 한번만 실행
        finalOptions: {
            width: 8, // 선 두께
            material: Cesium.Color.RED, // 선 색상
            clampToGround: true, // 선이 바닥에 붙음
        },
        onPointsChange: (points) => { // 경로 제작 반복적으로 실행되는 콜백 함수
            upsertTempRoute(points);
            requestRender() // 실시간 렌더링
        },
        onEnd: (entity, positions) => {
            const entityShallow = Object.create(
                Object.getPrototypeOf(entity),
                Object.getOwnPropertyDescriptors(entity)
            ) as Cesium.Entity;

            const positionsShallow = positions.slice();

            // 사용처에 shallow 복사본 전달/저장
            setTempEntity(entityShallow);

            viewer.entities.add(entityShallow);

            drawer.reset()
            onEnd(entityShallow, positionsShallow);
        },
    });
}

/**
 * 기존에 그렸던 Polyline을 제거하는 함수
 */
export function removeTempRoute() {
    const viewer = getViewer();
    const tempRoute = getTempEntity();

    viewer.entities.remove(tempRoute);
    setTempEntity(undefined);
    requestRender()

    const drawMarkerEntities = getTempRouteMarkers()
    clearMarkers(drawMarkerEntities) // 기존에 그려진 경로 마커들을 제거한다.
}

export function setTempRouteVisibility(visible: boolean) {
    const tempRoute = getTempEntity();

    // 엔티티 참조가 있으면 그것을 우선 사용
    tempRoute.show = visible;
    requestRender()
}
