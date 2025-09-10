import * as Cesium from "cesium";
import {UnactiveError} from "@/error/unactiveError";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";

export function getCameraPosition() {
    // NOTE 1. 전역 Viewer 대기
    const scene = getViewer().scene;

    // NOTE 2. 화면 중앙 값 판별
    // 화면 중앙지점 조준
    const ray = scene.camera.getPickRay(new Cesium.Cartesian2(
        scene.canvas.clientWidth / 2, // 화면 중앙 X
        scene.canvas.clientHeight / 2 // 화면 중앙 Y
    ));

    // 예외처리 (중앙 값이 식별되지 않은 경우)
    if(!ray) {
        alert("ray 생성 실패")
        throw new UnactiveError(-101, "버튼 비활성화");
    }

    // 화면 중앙 좌표 조회
    const cartesian = scene.globe.pick(ray!, scene);

    // 예외처리 (중앙의 위치가 잡히지 않은 경우)
    if(!cartesian) {
        alert("cartesian 생성 실패")
        throw new UnactiveError(-101, "버튼 비활성화");
    }

    // NOTE 3: 좌표계 변환 (Cartesian3 > 일반 좌표계)
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);

    return {
        lon:longitude,
        lat:latitude
    };
}