import * as Cesium from "cesium";
import {Cartesian3} from "cesium";

/**
 * 좌표를 기반으로 미터를 계산하는 함수
 *
 * @param points 총 거리를 계산할 좌표들의 집합
 */
export default function calcDistance(points: Cartesian3[]){
    let meters = 0;

    // 순환하며 거리 계산
    for (let i = 0; i + 1 < points.length; i++) {
        const start = Cesium.Cartographic.fromCartesian(points[i]);
        const end = Cesium.Cartographic.fromCartesian(points[i + 1]);
        meters += new Cesium.EllipsoidGeodesic(start, end).surfaceDistance;
    }

    // 원형 경로를 위한 보조선 거리 포함
    try {
        if (points.length >= 2) {
            const lastCarto = Cesium.Cartographic.fromCartesian(points[points.length - 1]);
            const firstCarto = Cesium.Cartographic.fromCartesian(points[0]);
            meters += new Cesium.EllipsoidGeodesic(lastCarto, firstCarto).surfaceDistance;
        }
    } catch {}

    return meters;
}