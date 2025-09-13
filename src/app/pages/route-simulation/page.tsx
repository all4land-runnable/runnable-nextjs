'use client';

import React, { useCallback, useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import styles from "./page.module.scss";

import getViewer from "@/app/components/organisms/cesium/util/getViewer";
import requestRender from "@/app/components/organisms/cesium/util/requestRender";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/app/store/redux/store";
import { setAutomaticRoute } from "@/app/store/redux/feature/rightSidebarSlice";

import { useRouter } from "next/navigation";
import { Chip } from "@/app/components/atom/chip/Chip";
import CategorySelect from "@/app/components/atom/category-select/CategorySelect";

import { getPedestrianRouteMarkers, getTempEntity, getTempRouteMarkers } from "@/app/staticVariables";
import hideMarkers from "@/app/utils/markers/hideMarkers";

import { Route } from "@/type/route";
import { formatSpeed } from "@/app/pages/route-simulation/utils/formatSpeed";

type FlyToOptions = Parameters<Cesium.Camera['flyTo']>[0];

/**
 * 유틸/상수
 */
const SPEED_BASE_MS = 3; // 카메라 시속: 지정 m/s
const ALT_OFFSET_M  = 2; // 카메라 고도: 지면 + 2 m
const BACK_OFFSET_M = 8; // 카메라 위치: 진행 방향 뒤 8m
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n)); // 경로 길이에 따른 duration을 안전 범위로 제한

/**
 * 두 좌표간 방위각을 계산하는 함수. (카메라의 시점을 정하기 위함)
 */
const headingBetween = (from: Cesium.Cartographic, to: Cesium.Cartographic) => {
    const deltaLongitude = to.longitude - from.longitude;
    const y = Math.sin(deltaLongitude) * Math.cos(to.latitude);
    const x =
        Math.cos(from.latitude) * Math.sin(to.latitude) -
        Math.sin(from.latitude) * Math.cos(to.latitude) * Math.cos(deltaLongitude);
    const brng = Math.atan2(y, x); // -π..π 범위를 반환하므로 0..2π 범위로 변환한다.
    return Cesium.Math.zeroToTwoPi(brng);
};

/**
 * 타깃 카토그래픽에서 '지면+offset'의 월드 좌표 반환
 *
 * 카메라가 있을 높이를 계산한다.
 * Offset은 추가로 연산될 값(카메라 위치)을 의미한다.
 */
const groundPosWithOffset = (scene: Cesium.Scene, carto: Cesium.Cartographic, offset: number) => {
    const ground = scene.globe.getHeight(carto); // 지면 높이 추출. 타일 로딩 상태에 따라 갱신된다.
    const h = (ground ?? carto.height ?? 0) + offset; // 높이에 오프셋을 추가
    return Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, h); // Cartesian을 추가
};

/**
 * 타깃(지면+2 m)을 기준으로 heading 방향 ENU 프레임에서 '뒤로 BACK_OFFSET_M, 위로 ALT_OFFSET_M' 오프셋을 적용한 카메라 포즈 계산
 * Matrix4.getColumn은 Cartesian4를 요구하므로, 추출 후 Cartesian3로 변환하여 방향 벡터에 사용한다.
 */
const cameraPoseAtWaypoint = (
    scene: Cesium.Scene,
    carto: Cesium.Cartographic,
    heading: number
) => {
    // 타깃: 지면+2 m
    const target = groundPosWithOffset(scene, carto, ALT_OFFSET_M);

    // ENU 프레임. target에서 동-북-업 축을 얻는다.
    const enu = Cesium.Transforms.eastNorthUpToFixedFrame(target);

    // getColumn의 반환 타입은 Cartesian4이므로, 이후 연산용으로 Cartesian3로 변환한다.
    const east4  = Cesium.Matrix4.getColumn(enu, 0, new Cesium.Cartesian4());  // X
    const north4 = Cesium.Matrix4.getColumn(enu, 1, new Cesium.Cartesian4());  // Y
    const east   = Cesium.Cartesian3.fromCartesian4(east4,  new Cesium.Cartesian3());
    const north  = Cesium.Cartesian3.fromCartesian4(north4, new Cesium.Cartesian3());

    // 진행 방향 벡터(heading=0 → north, 시계방향): forward
    const forward = Cesium.Cartesian3.normalize(
        Cesium.Cartesian3.add(
            Cesium.Cartesian3.multiplyByScalar(north, Math.cos(heading), new Cesium.Cartesian3()),
            Cesium.Cartesian3.multiplyByScalar(east,  Math.sin(heading), new Cesium.Cartesian3()),
            new Cesium.Cartesian3()
        ),
        new Cesium.Cartesian3()
    );

    // 카메라 위치 = target - forward*BACK_OFFSET_M (이미 target에서 +2m 반영됨)
    const back = Cesium.Cartesian3.multiplyByScalar(forward, -BACK_OFFSET_M, new Cesium.Cartesian3());
    const destination = Cesium.Cartesian3.add(target, back, new Cesium.Cartesian3());

    // 수직축, 횡축, 종축 설정. 약간 아래로 보도록 pitch를 음수로 준다.
    const pitch = Cesium.Math.toRadians(-10);
    const roll = 0;
    return { destination, orientation: { heading, pitch, roll } as FlyToOptions['orientation'] };
};

/**
 * camera.flyTo를 Promise로 래핑 (현재 버전 타입을 그대로 추론)
 */
const flyToAsync = (camera: Cesium.Camera, opts: FlyToOptions) =>
    new Promise<void>((resolve) => {
        // 카메라가 이동하는 동안 작업을 도중에 이동, 정지할 수 있는 리스너를 추가
        camera.flyTo({
            ...opts,
            complete: () => resolve(),
            cancel: () => resolve(),
        });
    });

/**
 * 카메라가 이동할 전체 경로를 설정한다.
 * 경유지는 각 섹션의 첫 점, 마지막 목적지는 마지막 섹션의 마지막 점이다.
 * 경유지의 고도는 사용하지 않고, 실제 이동 시 지면 높이에 +2m를 적용한다.
 */
const buildWaypoints = (route?: Route): Cesium.Cartographic[] => {
    const wayPoints: Cesium.Cartographic[] = []; // 카메라가 이동할 경로 지점들
    if (!route?.sections?.length) return wayPoints;

    // NOTE 1. 모든 경로의 첫번재 지점을 경유지로 설정한다.
    for (const section of route.sections) {
        const point = section.points[0];
        if (!point) continue;
        wayPoints.push(Cesium.Cartographic.fromDegrees(point.longitude, point.latitude, point.height ?? 0)); // 여기서 2m는 넣지 않는다. 지면 샘플 후 2m 오프셋을 적용하기 때문.
    }

    // NOTE 2. 최종 구간을 목적지로 추가한다.
    const lastSection = route.sections[route.sections.length - 1];
    const lastPoint = lastSection?.points?.[lastSection.points.length - 1];
    if (lastPoint) {
        const lastCarto = Cesium.Cartographic.fromDegrees(
            lastPoint.longitude,
            lastPoint.latitude,
            lastPoint.height ?? 0 // 여기서 2m는 넣지 않는다. 지면 샘플 후 2m 오프셋을 적용하기 때문.
        );
        const prev = wayPoints[wayPoints.length - 1];
        if (!prev || Math.abs(prev.longitude - lastCarto.longitude) > 1e-7 || Math.abs(prev.latitude - lastCarto.latitude) > 1e-7) {
            wayPoints.push(lastCarto);
        }
    }

    return wayPoints;
};

export default function Page() {
    const viewer = getViewer();
    const dispatch = useDispatch();
    const router = useRouter();

    const automaticRoute = useSelector((s: RootState) => s.rightSideBar.automaticRoute);
    const tempRoute = useSelector((s: RootState) => s.routeDrawing.tempRoute);
    const pedestrianRoute = useSelector((s: RootState) => s.routeDrawing.pedestrianRoute);

    const [simulation, setSimulation] = useState(false);

    // 현재 사용할 Route
    const currentRoute = automaticRoute ? tempRoute : pedestrianRoute;

    // 카테고리 셀렉터 상태
    const [category, setCategory] = React.useState('×1.0');

    // 시작 전 카메라 위치 저장소
    const savedCameraRef = useRef<{
        destination: Cesium.Cartesian3;
        heading: number;
        pitch: number;
        roll: number;
    } | null>(null);

    // 시뮬레이션 실행/취소 제어용 ref (state 캡처 문제 방지)
    const isRunningRef = useRef(false);
    const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });

    /**
     * 뒤로가기 버튼
     */
    const backButton = ()=>{
        stopSimulation(); // 복귀까지 수행
        router.back();
    }

    /**
     * 자동경로에 맞게 Entity 변경
     */
    useEffect(() => {
        hideMarkers(getTempRouteMarkers(), automaticRoute);
        const tempEntity = viewer.entities.getById(getTempEntity());
        if (tempEntity) tempEntity.show = automaticRoute;

        hideMarkers(getPedestrianRouteMarkers(), !automaticRoute);
        const pedestrianEntity = viewer.entities.getById("pedestrian_entity");
        if (pedestrianEntity) pedestrianEntity.show = !automaticRoute;

        requestRender();
        stopSimulation(); // 토글 시 시뮬레이션 중단 및 원래 시점 복귀
    }, [automaticRoute]);

    /**
     * 시뮬레이션 시작: ENU 오프셋(뒤 8 m, 위 2 m) 기반 flyTo → 도착 직후 setView로 보정
     */
    const startSimulation = useCallback(async () => {
        if (!currentRoute) {
            stopSimulation();
            return;
        }
        if (isRunningRef.current) return;

        isRunningRef.current = true;
        cancelRef.current.cancelled = false;

        const scene = viewer.scene;
        const camera = scene.camera;

        // 시작 전 카메라 저장
        const cam = scene.camera;
        savedCameraRef.current = {
            destination: cam.positionWC.clone(),
            heading: cam.heading,
            pitch: cam.pitch,
            roll: cam.roll,
        };

        // 경유지
        const wps = buildWaypoints(currentRoute);
        if (wps.length === 0) {
            alert("유효한 경유지가 없습니다.");
            stopSimulation();
            return;
        }

        // 속도(m/s) = 기본속도 × 배속
        const mult = formatSpeed(category);
        theSpeedLoop: {
            const speed = SPEED_BASE_MS * mult;

            // 경유지 순회
            const ellipsoid = Cesium.Ellipsoid.WGS84;
            for (let i = 0; i < wps.length; i++) {
                if (cancelRef.current.cancelled) break;

                const here = wps[i];
                const next = wps[i + 1] ?? wps[i];
                const heading = headingBetween(here, next);

                // 카메라 포즈 계산(뒤 8 m, 위 2 m)
                const pose = cameraPoseAtWaypoint(scene, here, heading);

                // duration 계산(거리/속도)
                let duration = 1.0;
                if (i > 0) {
                    const g = new Cesium.EllipsoidGeodesic(wps[i - 1], wps[i], ellipsoid);
                    const dist = g.surfaceDistance;
                    duration = clamp(dist / speed, 0.6, 5.0);
                }

                await flyToAsync(camera, {
                    destination: pose.destination,
                    orientation: pose.orientation,
                    duration, // 일정 속도 기반 이동
                    easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
                });

                // 도착 직후, 지형 로딩에 따른 고도 편차를 제거하기 위해 정확한 포즈로 한 번 더 보정
                const corrected = cameraPoseAtWaypoint(scene, here, heading);
                camera.setView({
                    destination: corrected.destination,
                    orientation: corrected.orientation,
                });
            }
        }

        // 정상 종료 시 원래 시점으로 복귀
        if (!cancelRef.current.cancelled) {
            const saved = savedCameraRef.current;
            if (saved) {
                camera.setView({
                    destination: saved.destination,
                    orientation: { heading: saved.heading, pitch: saved.pitch, roll: saved.roll },
                });
            }
        }

        savedCameraRef.current = null;
        isRunningRef.current = false;
    }, [currentRoute, category, viewer.scene]);

    /**
     * 시뮬레이션을 정지하는 함수
     * 종료하는 즉시 원래 시점으로 복귀한다.
     */
    const stopSimulation = useCallback(() => {
        cancelRef.current.cancelled = true;
        isRunningRef.current = false;

        const camera = savedCameraRef.current;
        if (!camera) return;

        const { destination, heading, pitch, roll } = camera;
        viewer.scene.camera.setView({
            destination,
            orientation: { heading, pitch, roll },
        });
        savedCameraRef.current = null;
    }, [viewer.scene.camera]);

    /**
     * 시뮬레이션을 시작, 종료하는 함수
     */
    const handleToggle = () => {
        if (isRunningRef.current) {
            setSimulation(false);
            stopSimulation();
        } else {
            setSimulation(true);
            startSimulation();
        }
    };

    return (
        <section className={styles.bottomSheet}>
            <div className={styles.listChips}>
                <Chip label={"뒤로가기"} activable={false} onClickAction={() => { stopSimulation(); router.back(); }} />
                <Chip label={isRunningRef.current ? "정지" : "시뮬레이션 시작"} onClickAction={handleToggle} />
                <Chip
                    label={"자동 경로"}
                    onClickAction={() => {
                        dispatch(setAutomaticRoute(!automaticRoute));
                    }}
                />
                <CategorySelect
                    categories={["×1.0", "×1.5", "×3.0", "×4.0", "×10.0"]}
                    value={category}
                    onChangeAction={(v: string) => setCategory(v)}
                />
            </div>
        </section>
    );
}
