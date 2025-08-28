import { viewerStore } from './viewerStore'
import * as Cesium from "cesium";
import {UnactiveError} from "@/error/unactiveError";
import {Viewer} from "cesium";

/**
 * 전역 Viewer를 쉽게 가져오기 위한 훅 인터페이스
 * - 즉시 사용 가능한 경우 즉시 반환
 * - 아직 없으면 나타날 때까지(타임아웃 없이) 대기 후 상태 반영
 */
export async function getViewer() {
    return await viewerStore.wait()
}

export async function getCameraPosition(viewer: Viewer) {
    // NOTE 1. 전역 Viewer 대기
    const scene = viewer.scene;

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
