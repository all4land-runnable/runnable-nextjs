import { JulianDate } from "cesium";
import {Cartesian3} from "cesium";
import * as Cesium from "cesium";
import {getTempRouteMarkers} from "@/app/staticVariables";
import requestRender from "@/app/components/organisms/cesium/util/requestRender";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";

export const getCircularPolyline = ()=>{
    const viewer = getViewer();

    // NOTE 2. 현재 시각 기준으로 엔티티의 좌표 추출
    const isFiniteCartesian3 = (c?: Cartesian3): c is Cartesian3 =>
        !!c && Number.isFinite(c.x) && Number.isFinite(c.y) && Number.isFinite(c.z);

    const positions = new Cesium.CallbackProperty(
        (t?: JulianDate): Cartesian3[] => {
            const time = t ?? Cesium.JulianDate.now();

            const points = getTempRouteMarkers()
                .map(e => e.position?.getValue?.(time) as Cartesian3 | undefined)
                .filter(isFiniteCartesian3);

            if (points.length < 2) return [];
            const first = points[0];
            const last = points.at(-1)!;     // 마지막 점

            // 양끝 점 연결
            return [last, first];
        },
        false
    );

    try {
        // NOTE 3. 예외처리: 기존 보조선이 남아있다면 제거(중복 추가 방지)
        viewer.entities.removeById("circular_line");

        // NOTE 4. 보조 폴리라인 엔티티 추가
        viewer.entities.add({
            id: "circular_line",
            polyline: new Cesium.PolylineGraphics({
                positions: positions,
                width: 10,
                material: Cesium.Color.RED.withAlpha(0.3),
                clampToGround: true,
            }),
        });

        requestRender()
    } catch {} // 에러 발생 시, 더이상 진행하지 않음
}