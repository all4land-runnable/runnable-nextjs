'use client';

import {useCallback, useEffect, useRef} from "react";
import * as Cesium from "cesium";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";
import { RootState } from "@/app/store/redux/store";
import { useSelector } from "react-redux";
import {getTempEntity} from "@/app/staticVariables";

// NOTE 0. 경로 그리기 로직
const RUN_SPEED_MPS = 1000 / (6 * 60);

export default function Page() {
    const viewer = getViewer();
    const clock = viewer.clock;

    const automaticRoute = useSelector((state: RootState) => state.rightSideBar.automaticRoute);
    const tempEntity = viewer.entities.getById(getTempEntity());
    const pedestrianEntity = viewer.entities.getById("pedestrian_entity");

    // NOTE 1. 시뮬레이션용 객체 생성
    // 추적용 가상 엔티티
    const trackerRef = useRef<Cesium.Entity | null>(null);
    // 카메라 루프 콜백 저장
    const postRenderCbRef = useRef<((scene: Cesium.Scene, time: Cesium.JulianDate) => void) | null>(null);

    // scratch 객체(alloc 최소화) // NOTE: ????
    const scratchQuat = useRef(new Cesium.Quaternion());
    const scratchRot = useRef(new Cesium.Matrix3());
    const scratchMat4 = useRef(new Cesium.Matrix4());

    // NOTE 2. Polyline에서 경로 좌표 배열 추출
    const extractPositions = useCallback((entity: Cesium.Entity): Cesium.Cartesian3[] | null => {
        const when = viewer.clock.currentTime;

        // 현재 시간에 있는 경로들을 추출한다.
        const positions = entity?.polyline?.positions;
        if (!positions) return []

        return positions.getValue(when) as Cesium.Cartesian3[];
    }, [viewer.clock]);

    // Cartesian3[] → SampledPositionProperty (지표거리 기준 시간 할당)
    const buildPathProperty = useCallback((pts: Cesium.Cartesian3[]) => {
        const prop = new Cesium.SampledPositionProperty();
        if (pts.length < 2) return { prop, start: Cesium.JulianDate.now(), stop: Cesium.JulianDate.now() };

        const ellipsoid = Cesium.Ellipsoid.WGS84;
        const cartos = pts.map((c) => ellipsoid.cartesianToCartographic(c));

        // 시작 시간
        const start = Cesium.JulianDate.addSeconds(Cesium.JulianDate.now(), 1, new Cesium.JulianDate());
        let t = Cesium.JulianDate.clone(start);

        prop.setInterpolationOptions({
            interpolationAlgorithm: Cesium.LagrangePolynomialApproximation,
            interpolationDegree: 2,
        });

        prop.addSample(t, pts[0]);

        for (let i = 1; i < cartos.length; i++) {
            const geo = new Cesium.EllipsoidGeodesic(cartos[i - 1], cartos[i]);
            const s = geo.surfaceDistance;             // meters
            const dt = s / RUN_SPEED_MPS;              // seconds
            t = Cesium.JulianDate.addSeconds(t, dt, new Cesium.JulianDate());
            prop.addSample(t, pts[i]);
        }

        prop.forwardExtrapolationType = Cesium.ExtrapolationType.NONE;
        prop.forwardExtrapolationDuration = 30;
        return { prop, start, stop: t };
    }, []);

    // 카메라 오프셋 추적 루프 시작
    const startCameraFollow = useCallback((trackEntity: Cesium.Entity) => {
        // 혹시 이전 콜백 있으면 제거
        if (postRenderCbRef.current) {
            viewer.scene.postRender.removeEventListener(postRenderCbRef.current);
            postRenderCbRef.current = null;
        }

        // trackedEntity 해제(우리가 직접 제어)
        viewer.trackedEntity = undefined;

        const AHEAD_M = 30; // 카메라가 바라볼 '앞쪽' 포인트까지의 거리
        const CAMERA_OFFSET_LOCAL = new Cesium.Cartesian3(-20, 0, 100); // 뒤 20m, 위 10m

        const cb = (scene: Cesium.Scene) => {
            const time = clock.currentTime;

            const pos = trackEntity.position?.getValue(time);
            const ori = trackEntity.orientation?.getValue(time, scratchQuat.current);
            if (!pos || !ori) return;

            // 1) 엔티티의 회전/모델행렬
            const rot = Cesium.Matrix3.fromQuaternion(ori, scratchRot.current);
            const model = Cesium.Matrix4.fromRotationTranslation(rot, pos, scratchMat4.current);

            // 2) '앞쪽' 월드 좌표 계산: 엔티티 로컬 +X로 AHEAD_M만큼
            const aheadLocal = new Cesium.Cartesian3(AHEAD_M, 0, 0);
            const aheadWorld = Cesium.Matrix4.multiplyByPoint(model, aheadLocal, new Cesium.Cartesian3());

            // 3) '앞쪽'을 원점으로 하고, 엔티티와 같은 회전을 갖는 변환행렬
            const modelAhead = Cesium.Matrix4.fromRotationTranslation(rot, aheadWorld, new Cesium.Matrix4());

            // 4) 해당 변환행렬 기준으로 카메라 배치:
            //    - 타깃: 앞쪽 지점(aheadWorld)
            //    - 위치: 로컬에서 뒤(-X) 20m, 위(+Z) 10m
            scene.camera.lookAtTransform(modelAhead, CAMERA_OFFSET_LOCAL);
        };


        viewer.scene.postRender.addEventListener(cb);
        postRenderCbRef.current = cb;
    }, [clock, viewer]);

    // 루프/트래커 해제
    const stopCameraFollow = useCallback(() => {
        if (postRenderCbRef.current) {
            viewer.scene.postRender.removeEventListener(postRenderCbRef.current);
            postRenderCbRef.current = null;
        }
        viewer.scene.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    }, [viewer]);

    // 시뮬 시작: 추적 엔티티 생성 + 카메라 오프셋 추적
    const startSimulation = useCallback((routeEntity: Cesium.Entity) => {
        // 기존 추적 엔티티 제거
        if (trackerRef.current) {
            viewer.entities.remove(trackerRef.current);
            trackerRef.current = null;
        }

        const pts = extractPositions(routeEntity);
        if (!pts || pts.length < 2) {
            console.warn("경로가 충분하지 않습니다. Polyline.positions 또는 최소 2개 점 필요");
            return;
        }

        const { prop, start, stop } = buildPathProperty(pts);

        // 진행 방향 자동 회전
        const tracker = viewer.entities.add({
            id: "route_sim_camera",
            availability: new Cesium.TimeIntervalCollection([
                new Cesium.TimeInterval({ start, stop }),
            ]),
            position: prop,
            orientation: new Cesium.VelocityOrientationProperty(prop),
            // 시각 요소 최소화
            point: { pixelSize: 1, color: Cesium.Color.TRANSPARENT, show: true },
        });
        trackerRef.current = tracker;

        // 시계
        clock.startTime = Cesium.JulianDate.clone(start);
        clock.stopTime = Cesium.JulianDate.clone(stop);
        clock.currentTime = Cesium.JulianDate.clone(start);
        clock.clockRange = Cesium.ClockRange.CLAMPED;
        clock.multiplier = 1;
        clock.shouldAnimate = true;

        // ✅ 카메라 오프셋 추적 시작
        startCameraFollow(tracker);
    }, [buildPathProperty, clock, extractPositions, startCameraFollow, viewer]);

    // 정지
    const stopSimulation = useCallback(() => {
        clock.shouldAnimate = false;
        if (trackerRef.current) {
            viewer.entities.remove(trackerRef.current);
            trackerRef.current = null;
        }
        stopCameraFollow();
    }, [clock, stopCameraFollow, viewer]);

    // 엔티티/옵션 바뀔 때 정리
    useEffect(() => {
        if (!pedestrianEntity || !tempEntity) return;
        return () => {
            stopSimulation();
        };
    }, [automaticRoute, pedestrianEntity, tempEntity, stopSimulation]);

    const handleToggle = () => {
        // 토글
        if (postRenderCbRef.current) {
            stopSimulation();
            return;
        }
        const routeEntity = automaticRoute ? tempEntity : pedestrianEntity;
        if (!routeEntity) {
            alert("엔티티가 존재하지 않습니다.");
            return;
        }
        startSimulation(routeEntity);
    };

    if (!pedestrianEntity || !tempEntity) {
        return <>엔티티가 존재하지 않습니다.</>;
    }

    return (
        <div
            style={{
                position: "absolute",
                bottom: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
                pointerEvents: "auto",
            }}
        >
            <button
                onClick={handleToggle}
                style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    backgroundColor: "#4a90e2",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "bold",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                }}
            >
                {postRenderCbRef.current ? "정지" : automaticRoute ? "보행자 추적 시작" : "경로 추적 시작"}
            </button>
        </div>
    );
}
