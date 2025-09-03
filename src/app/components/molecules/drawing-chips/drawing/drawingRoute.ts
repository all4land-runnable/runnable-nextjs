import * as Cesium from "cesium";
import { Cartesian3 } from "cesium";
import { getViewer } from "@/app/components/templates/cesium/viewer/getViewer";
import { getDrawer } from "@/app/components/templates/cesium/drawer/getDrawer";
import calcDistance from "@/app/utils/claculator/calcDistance";
import upsertDrawMarkers from "@/app/components/molecules/drawing-chips/drawing/upsertDrawMarkers";
import clearMarkers from "@/app/utils/markers/clearMarkers";
import {drawMarkerEntities} from "@/app/staticVariables";
import { setDrawPolylineEntity, drawPolylineEntity } from "@/app/staticVariables"; // ✅ 추가

/**
 * 그리기에서 만들어지는 Polyline의 id를 담아두는 전역 변수이다.
 */
let drawPolyline: string = "";

/**
 * 경로를 제작할 때 실행되는 함수이다.
 *
 * @param onEnd 경로 그리기가 끝나고 발생하는 이벤트 리스너
 */
export default async function drawingRoute(
    onEnd: (entity: Cesium.Entity, positions: Cartesian3[]) => void
) {
    // viewer 싱글톤 인스턴스
    const viewer = await getViewer();

    // drawer 싱글톤 인스턴스
    const drawer = await getDrawer();

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
            const distance = calcDistance(points); // 거리 계산

            // 빠른 작업을 위한 await 제거 (getViewer 대신 파라미터로 전달)
            upsertDrawMarkers(viewer, points, distance);

            viewer.scene.requestRender?.(); // 실시간 렌더링
        },
        onEnd: (entity, positions) => {
            drawPolyline = entity.id; // 새로운 Polyline의 id 값을 저장
            setDrawPolylineEntity(entity); // 엔티티 참조도 함께 저장
            onEnd(entity, positions); // 엔티티 생성 후 수행할 작업
        },
    });
}

/**
 * 기존에 그렸던 Polyline을 제거하는 함수
 */
export function removeDrawPolyline() {
    getViewer().then(viewer => {
        viewer.entities.removeById(drawPolyline);
        clearMarkers(drawMarkerEntities) // 기존에 그려진 경로 마커들을 제거한다.
    });
}

export function getDrawPolyline() {
    return drawPolyline;
}

export function setDrawPolylineVisibility(visible: boolean) {
    // 엔티티 참조가 있으면 그것을 우선 사용
    if (drawPolylineEntity) {
        drawPolylineEntity.show = visible;
        getViewer().then(viewer => viewer.scene.requestRender?.());
        return;
    }

    getViewer().then(viewer => {
        if (!drawPolyline) return;

        const entity = viewer.entities.getById(drawPolyline);
        if (entity) {
            entity.show = visible;
            viewer.scene.requestRender?.();
        }
    });
}
