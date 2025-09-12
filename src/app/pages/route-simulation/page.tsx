'use client';

import React, {useCallback, useEffect, useRef} from "react";
import * as Cesium from "cesium";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";
import { RootState } from "@/app/store/redux/store";
import {useDispatch, useSelector} from "react-redux";
import {getTempEntity, getTempRouteMarkers} from "@/app/staticVariables";
import hideMarkers from "@/app/utils/markers/hideMarkers";
import requestRender from "@/app/components/organisms/cesium/util/requestRender";
import {Chip} from "@/app/components/atom/chip/Chip";
import {remToPx} from "@/app/utils/claculator/pxToRem";
import styles from "./page.module.scss";
import {setAutomaticRoute, setRightSidebarOpen} from "@/app/store/redux/feature/rightSidebarSlice";
import {useRouter} from "next/navigation";
import CategorySelect from "@/app/components/atom/category-select/CategorySelect";
import {formatSpeed} from "@/app/pages/route-simulation/utils/formatSpeed";
import {removePedestrianRoute} from "@/app/pages/route-drawing/utils/drawingTempRoute";

export default function Page() {
    const viewer = getViewer();
    const dispatch = useDispatch()
    const router = useRouter();
    const clock = viewer.clock;

    const automaticRoute = useSelector((state: RootState) => state.rightSideBar.automaticRoute);
    const tempEntity = viewer.entities.getById(getTempEntity());
    const pedestrianEntity = viewer.entities.getById("pedestrian_entity");

    // 카테고리 상태
    const [cat, setCat] = React.useState('×1.0');

    // NOTE 0. 시뮬레이션용 객체 생성
    // 추적용 가상 엔티티
    const trackerRef = useRef<Cesium.Entity | null>(null);
    // 카메라 루프 콜백 저장
    const postRenderCbRef = useRef<((scene: Cesium.Scene, time: Cesium.JulianDate) => void) | null>(null);

    // scratch 객체(alloc 최소화) // TODO: 사용 이유 조사할 것
    const scratchQuat = useRef(new Cesium.Quaternion());
    const scratchRot = useRef(new Cesium.Matrix3());
    const scratchMat4 = useRef(new Cesium.Matrix4());
    const firstAlignDoneRef = useRef(false); // 처음 한 번만 정면 정렬

    const savedCameraRef = useRef<{
        destination: Cesium.Cartesian3;
        heading: number;
        pitch: number;
        roll: number;
    } | null>(null);

    const backButton = ()=>{
        removePedestrianRoute()
        dispatch(setRightSidebarOpen(false));
        router.back();
    }

    // NOTE 1. 자동해제 동작 수행
    useEffect(() => {
        const on = automaticRoute;
        hideMarkers(getTempRouteMarkers(), on);

        const tempEntity = viewer.entities.getById(getTempEntity());
        if(tempEntity) tempEntity.show = on;

        const pedestrianEntity = viewer.entities.getById("pedestrian_entity");
        if(pedestrianEntity) pedestrianEntity.show = !on;

        requestRender()
    }, [automaticRoute, viewer.entities]);

    // NOTE 2. Polyline에서 경로 좌표 배열 추출
    const extractPositions = useCallback((entity: Cesium.Entity): Cesium.Cartesian3[] | null => {
        const when = viewer.clock.currentTime;

        // 현재 시간에 있는 경로들을 추출한다.
        const positions = entity?.polyline?.positions;
        if (!positions) return []

        return positions.getValue(when) as Cesium.Cartesian3[];
    }, [viewer.clock]);

    // NOTE 3. Polyline Positions를 기반으로 SampledPositionProperty 추출
    const buildPathProperty = useCallback((positions: Cesium.Cartesian3[]) => {
        const samplePositions = new Cesium.SampledPositionProperty();

        // 예외처리: 경로가 존재하지 않는다면, 기본값 반환
        if (positions.length < 2) {
            return {
                samplePositionProperty: samplePositions,
                start: Cesium.JulianDate.now(),
                stop: Cesium.JulianDate.now()
            };
        }

        // 좌표계 불러오기
        const ellipsoid = Cesium.Ellipsoid.WGS84;
        // 위도 경도 추출 (cartographic)
        const cartographic = positions.map((c) => ellipsoid.cartesianToCartographic(c));

        // 시작 시간
        const start = Cesium.JulianDate.addSeconds(Cesium.JulianDate.now(), 1, new Cesium.JulianDate());
        // 엔티티의 애니메이션을 제작하면서 누적 시간을 측정하는 객체이다.
        let time = Cesium.JulianDate.clone(start);

        // ???
        samplePositions.setInterpolationOptions({
            interpolationAlgorithm: Cesium.LagrangePolynomialApproximation,
            interpolationDegree: 2,
        });

        // 엔티티가 이동할 속도
        const PaceSpeed = 1000 / (6 * 60);

        // 각 위치를 순회하면서 SampledPostitions에 경로 추가
        samplePositions.addSample(time, positions[0]);
        for (let i = 1; i < cartographic.length; i++) {
            const geo = new Cesium.EllipsoidGeodesic(cartographic[i - 1], cartographic[i]);
            const meter = geo.surfaceDistance; // meter
            const speed = meter / PaceSpeed; // seconds
            time = Cesium.JulianDate.addSeconds(time, speed, new Cesium.JulianDate());
            samplePositions.addSample(time, positions[i]);
        }

        // ???
        samplePositions.forwardExtrapolationType = Cesium.ExtrapolationType.NONE;
        samplePositions.forwardExtrapolationDuration = 30;
        return { samplePositionProperty: samplePositions, start, stop: time };
    }, []);

    /**
     * 카메라가 엔티티 추적을 시작하는 함수
     */
    const startCameraFollow = useCallback((trackEntity: Cesium.Entity) => {
        // 혹시 이전 콜백 있으면 제거
        if (postRenderCbRef.current) {
            viewer.scene.postRender.removeEventListener(postRenderCbRef.current);
            postRenderCbRef.current = null;
        }

        // trackedEntity 해제(우리가 직접 제어) // TODO: 사용 이유 조사할 것
        viewer.trackedEntity = undefined;
        firstAlignDoneRef.current = false; // 새 추적 시작마다 초기화

        // 카메라가 존재하는 위치(뒤 20m)
        const CAMERA_OFFSET_LOCAL = new Cesium.Cartesian3(-10, 0, 0);

        const cameraMovement = (scene: Cesium.Scene) => {
            const time = clock.currentTime;

            // NOTE 1. 카메라가 추적하고 있는 엔티티의 위치와 방향을 얻는다.
            const entityPosition = trackEntity.position?.getValue(time);
            const entityOrientation = trackEntity.orientation?.getValue(time, scratchQuat.current);
            if (!entityPosition || !entityOrientation) return;

            // 1) 엔티티의 회전/모델행렬
            const rot = Cesium.Matrix3.fromQuaternion(entityOrientation, scratchRot.current);
            const model = Cesium.Matrix4.fromRotationTranslation(rot, entityPosition, scratchMat4.current);

            // NOTE 2. 엔티티 자체(model)를 원점으로 하여 카메라 배치:
            //    - 타깃: 엔티티 위치(= model 원점)
            //    - 위치: 엔티티 로컬 기준 뒤 10m(CAMERA_OFFSET_LOCAL)
            //    ⇒ 항상 targetEntity를 바라보는 시점 유지
            scene.camera.lookAtTransform(model, CAMERA_OFFSET_LOCAL);
        };

        viewer.scene.postRender.addEventListener(cameraMovement);
        postRenderCbRef.current = cameraMovement;
    }, [clock, viewer]);

    /**
     * 카메라가 엔티티 추적을 종료하는 함수
     */
    const stopCameraFollow = useCallback(() => {
        if (postRenderCbRef.current) {
            viewer.scene.postRender.removeEventListener(postRenderCbRef.current);
            postRenderCbRef.current = null;
        }
        viewer.scene.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    }, [viewer]);

    /**
     * 시뮬레이션을 시작하는 함수
     */
    const startSimulation = useCallback((routeEntity: Cesium.Entity) => {
        // 기존 추적 엔티티 제거
        if (trackerRef.current) {
            viewer.entities.remove(trackerRef.current);
            trackerRef.current = null;
        }

        // NOTE 1. 엔티티의 좌표 정보를 추출한다.
        const positions = extractPositions(routeEntity);
        if (!positions || positions.length < 2) {
            console.warn("경로가 충분하지 않습니다. Polyline.positions 또는 최소 2개 점 필요");
            return;
        }

        // NOTE 2. {경로 객체, 시작 시간, 소요 시간} 측정
        const { samplePositionProperty, start, stop } = buildPathProperty(positions);

        // NOTE 3. 진행 방향 자동 회전 // TODO: 사용 이유 조사할 것
        const adjustedPosition = new Cesium.CallbackPositionProperty(
            (t, result) => {
                const base = samplePositionProperty.getValue(t);
                if (!base) return undefined;
                const carto = Cesium.Cartographic.fromCartesian(base);
                const ground = viewer.scene.globe.getHeight(carto);
                carto.height = (ground ?? carto.height ?? 0) + 2.0;
                return Cesium.Cartesian3.fromRadians(
                    carto.longitude,
                    carto.latitude,
                    carto.height,
                    Cesium.Ellipsoid.WGS84,
                    result as Cesium.Cartesian3
                );
            },
            false,
            Cesium.ReferenceFrame.FIXED
        );

        // 엔티티 생성 시 적용
        const tracker = viewer.entities.add({
            id: "tracker",
            availability: new Cesium.TimeIntervalCollection([
                new Cesium.TimeInterval({ start, stop }),
            ]),
            position: adjustedPosition,
            orientation: new Cesium.VelocityOrientationProperty(adjustedPosition),
            point: { pixelSize: 1, color: Cesium.Color.TRANSPARENT, show: true },
        });
        trackerRef.current = tracker;

        // NOTE 4. 시계정보 최신화
        clock.startTime = Cesium.JulianDate.clone(start);
        clock.stopTime = Cesium.JulianDate.clone(stop);
        clock.currentTime = Cesium.JulianDate.clone(start);
        clock.clockRange = Cesium.ClockRange.CLAMPED;

        clock.multiplier = formatSpeed(cat);

        clock.shouldAnimate = true;

        // NOTE 5. 기존 카메라 위치 저장
        const cam = viewer.scene.camera;
        savedCameraRef.current = {
            destination: cam.positionWC.clone(),
            heading: cam.heading,
            pitch: cam.pitch,
            roll: cam.roll,
        };

        // NOTE 6. 카메라가 엔티티 추적을 시작
        startCameraFollow(tracker);
    }, [buildPathProperty, clock, extractPositions, startCameraFollow, viewer]);

    /**
     * 시뮬레이션을 종료하는 함수
     */
    const stopSimulation = useCallback(() => {
        clock.shouldAnimate = false; // 애니메이션 제거
        if (trackerRef.current) { // tracker 제거 및 종료
            viewer.entities.remove(trackerRef.current);
            trackerRef.current = null;
        }
        stopCameraFollow(); // 카메라 고정 제거

        // 기존 카메라 상태로 복구
        if (savedCameraRef.current) {
            const { destination, heading, pitch, roll } = savedCameraRef.current;
            viewer.scene.camera.setView({
                destination,
                orientation: { heading, pitch, roll },
            });
            savedCameraRef.current = null;
        }
    }, [clock, stopCameraFollow, viewer]);

    /**
     * 엔티티/옵션 바뀔 때 자동 종료
     */
    useEffect(() => {
        if (!pedestrianEntity || !tempEntity) return;
        return () => {
            stopSimulation();
        };
    }, [automaticRoute, pedestrianEntity, tempEntity, stopSimulation]);

    /**
     * 애니메이션 시작 종료 토글
     */
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

    /**
     * 배속 실시간 변경
     */
    useEffect(() => {
        // 시뮬레이션이 진행 중일 때만 반영
        if (postRenderCbRef.current) {
            clock.multiplier = formatSpeed(cat);
        }
    }, [cat, clock]);

    if (!pedestrianEntity || !tempEntity) {
        return <>엔티티가 존재하지 않습니다.</>;
    }

    return (
        <section className={styles.bottomSheet}>
            <Chip label={"뒤로가기"} activable={false} onClickAction={backButton}/>
            <Chip label={postRenderCbRef.current ? "정지" : "시뮬레이션 시작"} onClickAction={handleToggle}/> {/* 시뮬레이션 시작 */}
            <Chip label={"자동 경로"} onClickAction={()=>{dispatch(setAutomaticRoute(!automaticRoute))}}/> {/* 자동 경로 토글 */}
            <CategorySelect categories={['×1.0', '×1.5', '×3.0', '×4.0', '×10.0']} value={cat} onChangeAction={(value: string) => setCat(value)}/> {/* 경로 카테고리 */}
        </section>
    );
}
