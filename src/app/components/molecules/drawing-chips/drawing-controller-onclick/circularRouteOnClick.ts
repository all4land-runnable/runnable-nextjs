import * as Cesium from "cesium";
import type { JulianDate, Cartesian3 } from "cesium";
import { getViewer } from "@/app/components/templates/cesium/viewer/getViewer";
import { drawMarkerEntities } from "@/app/components/molecules/drawing-chips/drawing/upsertDrawMarkers";

export let circularHelperEntity: Cesium.Entity | null = null;

/**
 * 원형 경로를 위한 보조선을 생성하는 함수이다.
 *
 * @param circular 현재(토글 이전)의 원형 경로 여부
 */
export default async function circularRouteOnClick(circular: boolean) {
    // viewer 싱글톤 인스턴스
    const viewer = await getViewer();

    // 보조 폴리라인 제거 함수
    const removeHelper = () => {
        if (circularHelperEntity) {
            viewer.entities.remove(circularHelperEntity);
            circularHelperEntity = null;
            viewer.scene.requestRender?.();
        }
    };

    // 보조 폴리라인 생성 함수
    const addHelper = () => {
        if (circularHelperEntity) return; // 중복 생성 방지

        // 시작점과 끝점을 실시간으로 연결하는 CallbackProperty
        const positionsProp = new Cesium.CallbackProperty(
            (julianTime?: JulianDate): Cartesian3[] => {
                // time이 undefined일 수 있으므로 안전한 기본값 사용
                const time = julianTime ?? Cesium.JulianDate.now();

                // 현재 그리기 마커들의 좌표를 time 기준으로 얻는다.
                const points: Cartesian3[] = drawMarkerEntities
                    .map(entity => entity.position?.getValue?.(time) as Cartesian3 | undefined)
                    .filter((position): position is Cartesian3 => !!position);

                if (points.length >= 2) {
                    const first = points[0];
                    const last = points[points.length - 1];
                    // 마지막 점 ↔ 첫 점 연결
                    return [last, first];
                }
                return [];
            },
            false
        );

        // 보조 폴리라인 엔티티 추가
        circularHelperEntity = viewer.entities.add({
            polyline: new Cesium.PolylineGraphics({
                positions: positionsProp,
                width: 8,
                material: Cesium.Color.RED.withAlpha(0.3),
                clampToGround: true,
            }),
        });

        viewer.scene.requestRender?.();
    };

    // 토글 반영
    if (circular) addHelper();
    else removeHelper();
}
