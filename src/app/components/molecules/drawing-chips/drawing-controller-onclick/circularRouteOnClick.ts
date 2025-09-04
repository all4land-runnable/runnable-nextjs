import * as Cesium from "cesium";
import type { JulianDate, Cartesian3 } from "cesium";
import getViewer from "@/app/components/templates/cesium/util/getViewer";
import {getCircularHelper, getTempRouteMarkers, setCircularHelper} from "@/app/staticVariables";

// 보조 폴리라인 제거 함수
export const removeCircular = () => {
    const viewer = getViewer();
    const circularHelper = getCircularHelper()

    viewer.entities.remove(circularHelper);
    setCircularHelper(undefined);

    viewer.scene.requestRender?.();
};

// 보조 폴리라인 생성 함수
export const addCircular = () => {
    const viewer = getViewer();

    // 시작점과 끝점을 실시간으로 연결하는 CallbackProperty
    const positionsProp = new Cesium.CallbackProperty(
        (julianTime?: JulianDate): Cartesian3[] => {
            // time이 undefined일 수 있으므로 안전한 기본값 사용
            const time = julianTime ?? Cesium.JulianDate.now();

            // 현재 그리기 마커들의 좌표를 time 기준으로 얻는다.
            const points: Cartesian3[] = getTempRouteMarkers()
                .map(entity => entity.position?.getValue?.(time) as Cartesian3)
                .filter((position): position is Cartesian3 => !!position);

            if (points.length >= 2) {
                const first = points[0];
                const last = points[points.length - 1];
                // 양끝 점 연결
                return [last, first];
            }
            return [];
        },
        false
    );

    // 보조 폴리라인 엔티티 추가
    const entity = viewer.entities.add({
        polyline: new Cesium.PolylineGraphics({
            positions: positionsProp,
            width: 8,
            material: Cesium.Color.RED.withAlpha(0.3),
            clampToGround: true,
        }),
    });
    setCircularHelper(entity);

    viewer.scene.requestRender?.();
};

export const setCircularVisibility = (visible: boolean) => {
    // 원형 경로가 설정 됐을때만,
    try {
        const circularHelper = getCircularHelper()
        circularHelper.show = visible
    } catch {}
}