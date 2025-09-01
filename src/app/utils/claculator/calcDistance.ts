import * as Cesium from "cesium";
import {Cartesian3} from "cesium";

export default function calcDistance(points: Cartesian3[]){
    let meters = 0;

    for (let i = 0; i + 1 < points.length; i++) {
        const start = Cesium.Cartographic.fromCartesian(points[i]);
        const end = Cesium.Cartographic.fromCartesian(points[i + 1]);
        meters += new Cesium.EllipsoidGeodesic(start, end).surfaceDistance;
    }

    return meters;
}