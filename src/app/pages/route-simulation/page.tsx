'use client';

import React, { useCallback, useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import styles from "./page.module.scss";
import defaultStyle from '@/app/page.module.scss'

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

import { formatSpeed } from "@/app/pages/route-simulation/utils/formatSpeed";
import { Route } from "@/type/route";

type Orientation = NonNullable<Parameters<Cesium.Camera['setView']>[0]>['orientation'];

/** ===== 파라미터 (요구 #6) ===== */
const BASE_PACE_SECONDS = 360;                  // 6'00"/km
const BASE_SPEED_MS = 1000 / BASE_PACE_SECONDS; // m/s = 2.777...
const ALT_OFFSET_M  = 2;   // 지면 +2 m (항상 유지)
const BACK_OFFSET_M = 8;   // 진행방향 뒤 8 m
const PITCH_RAD     = Cesium.Math.toRadians(-10);

/** 유틸 */
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** 방위각(0..2π) */
const headingBetween = (from: Cesium.Cartographic, to: Cesium.Cartographic) => {
    const dLon = to.longitude - from.longitude;
    const y = Math.sin(dLon) * Math.cos(to.latitude);
    const x = Math.cos(from.latitude) * Math.sin(to.latitude) -
        Math.sin(from.latitude) * Math.cos(to.latitude) * Math.cos(dLon);
    return Cesium.Math.zeroToTwoPi(Math.atan2(y, x));
};

/** 지면+offset 목표점의 월드 좌표 */
const groundPosWithOffset = (scene: Cesium.Scene, carto: Cesium.Cartographic, offset: number) => {
    const ground = scene.globe.getHeight(carto);
    const h = (ground ?? carto.height ?? 0) + offset;
    return Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, h);
};

/** 카메라 포즈(지면+2m를 타깃으로, heading 정면을 바라보며 뒤로 BACK_OFFSET_M) */
const cameraPoseAt = (scene: Cesium.Scene, carto: Cesium.Cartographic, heading: number) => {
    const target = groundPosWithOffset(scene, carto, ALT_OFFSET_M); // 항상 2 m
    const enu = Cesium.Transforms.eastNorthUpToFixedFrame(target);

    const east4  = Cesium.Matrix4.getColumn(enu, 0, new Cesium.Cartesian4());
    const north4 = Cesium.Matrix4.getColumn(enu, 1, new Cesium.Cartesian4());
    const east   = Cesium.Cartesian3.fromCartesian4(east4,  new Cesium.Cartesian3());
    const north  = Cesium.Cartesian3.fromCartesian4(north4, new Cesium.Cartesian3());

    const forward = Cesium.Cartesian3.normalize(
        Cesium.Cartesian3.add(
            Cesium.Cartesian3.multiplyByScalar(north, Math.cos(heading), new Cesium.Cartesian3()),
            Cesium.Cartesian3.multiplyByScalar(east,  Math.sin(heading), new Cesium.Cartesian3()),
            new Cesium.Cartesian3()
        ),
        new Cesium.Cartesian3()
    );

    const back = Cesium.Cartesian3.multiplyByScalar(forward, -BACK_OFFSET_M, new Cesium.Cartesian3());
    const destination = Cesium.Cartesian3.add(target, back, new Cesium.Cartesian3());
    const orientation: Orientation = { heading, pitch: PITCH_RAD, roll: 0 };

    return { destination, orientation };
};

/** Route → 경유지 생성 (요구 #7: 각 섹션의 첫 점 + 마지막 섹션의 마지막 점) */
const buildWaypointsFromRoute = (route?: Route): Cesium.Cartographic[] => {
    const wps: Cesium.Cartographic[] = [];
    if (!route?.sections?.length) return wps;

    for (const section of route.sections) {
        const p0 = section.points?.[0];
        if (!p0) continue;
        wps.push(Cesium.Cartographic.fromDegrees(p0.longitude, p0.latitude, p0.height ?? 0));
    }
    const lastSec = route.sections[route.sections.length - 1];
    const lastPt  = lastSec?.points?.[lastSec.points.length - 1];
    if (lastPt) {
        const lastC = Cesium.Cartographic.fromDegrees(lastPt.longitude, lastPt.latitude, lastPt.height ?? 0);
        const prev  = wps[wps.length - 1];
        if (!prev || Math.abs(prev.longitude - lastC.longitude) > 1e-7 || Math.abs(prev.latitude - lastC.latitude) > 1e-7) {
            wps.push(lastC);
        }
    }
    return wps;
};

/** 경로 메트릭(세그먼트 지오데식·길이·누적길이) 사전계산 → per-frame 계산량 최소화 */
const precomputePath = (wps: Cesium.Cartographic[]) => {
    const geos: Cesium.EllipsoidGeodesic[] = [];
    const segLen: number[] = [];
    const cumLen: number[] = [];
    let total = 0;

    for (let i = 0; i < wps.length - 1; i++) {
        const g = new Cesium.EllipsoidGeodesic(wps[i], wps[i + 1], Cesium.Ellipsoid.WGS84);
        const L = g.surfaceDistance || 0;
        geos.push(g);
        segLen.push(L);
        total += L;
        cumLen.push(total);
    }
    return { geos, segLen, cumLen, total };
};

/** 누적거리 d에서의 위치/세그먼트 인덱스/세그먼트 내 보간비율 */
const evalAlongPath = (
    d: number,
    wps: Cesium.Cartographic[],
    geos: Cesium.EllipsoidGeodesic[],
    segLen: number[],
    cumLen: number[],
    currIdx: number
) => {
    while (currIdx < cumLen.length - 1 && d > cumLen[currIdx]) currIdx++;

    const segStartDist = currIdx === 0 ? 0 : cumLen[currIdx - 1];
    const L = Math.max(segLen[currIdx], 1e-6);
    const f = clamp01((d - segStartDist) / L);

    const pos = geos[currIdx].interpolateUsingFraction(f);
    const segEnd = wps[currIdx + 1]; // ★ 항상 현재 도착지점을 바라본다
    const heading = headingBetween(pos, segEnd);

    return { pos, heading, currIdx, f };
};

export default function Page() {
    const viewer  = getViewer();
    const dispatch = useDispatch();
    const router   = useRouter();

    // (요구 #3) 자동일 때 tempRoute, 아니면 pedestrianRoute 사용
    const automaticRoute  = useSelector((s: RootState) => s.rightSideBar.automaticRoute);
    const tempRoute       = useSelector((s: RootState) => s.routeDrawing.tempRoute);
    const pedestrianRoute = useSelector((s: RootState) => s.routeDrawing.pedestrianRoute);
    const currentRoute: Route = automaticRoute ? tempRoute! : pedestrianRoute!;

    const [category, setCategory] = useState("×1.0");

    // --- 시뮬 상태 refs ---
    const speedMultRef = useRef(1.0);
    const isRunningRef = useRef(false);
    const cancelRef    = useRef(false);
    const wasAnimatingRef = useRef<boolean>(false); // ★ 시계 상태 복원용

    const savedCamRef = useRef<{
        destination: Cesium.Cartesian3;
        heading: number; pitch: number; roll: number;
    } | null>(null);

    const tickHandlerRef = useRef<((clock: Cesium.Clock) => void) | null>(null);
    const prevTimeRef    = useRef<Cesium.JulianDate | null>(null);
    const distRef        = useRef(0);   // 누적 거리(m)
    const segIdxRef      = useRef(0);   // 현재 세그먼트 인덱스

    // 경로 캐시
    const wpsRef     = useRef<Cesium.Cartographic[]>([]);
    const geosRef    = useRef<Cesium.EllipsoidGeodesic[]>([]);
    const segLenRef  = useRef<number[]>([]);
    const cumLenRef  = useRef<number[]>([]);
    const totalRef   = useRef(0);

    // 배속 변경은 즉시 반영(onTick에서 읽음)
    useEffect(() => {
        const m = formatSpeed(category);
        speedMultRef.current = Number.isFinite(m) ? m : 1.0;
    }, [category]);

    /** 자동경로 토글 시 표시/시뮬 리셋 */
    useEffect(() => {
        hideMarkers(getTempRouteMarkers(), automaticRoute);
        const t = viewer.entities.getById(getTempEntity());
        if (t) t.show = automaticRoute;

        hideMarkers(getPedestrianRouteMarkers(), !automaticRoute);
        const p = viewer.entities.getById("pedestrian_entity");
        if (p) p.show = !automaticRoute;

        requestRender();
        stopSimulation();
    }, [automaticRoute, viewer]);

    /** 시뮬 시작 */
    const startSimulation = useCallback(() => {
        if (isRunningRef.current) return;

        // 경유지 생성
        const wps = buildWaypointsFromRoute(currentRoute);
        if (wps.length < 2) {
            console.warn("[route-simulation] path total length is 0 or less. waypoints:", wps);
            alert("유효한 경유지가 없습니다.");
            stopSimulation();
            return;
        }

        // 메트릭 사전 계산
        const { geos, segLen, cumLen, total } = precomputePath(wps);
        if (total <= 0) {
            console.warn("[route-simulation] precompute total=0");
            alert("경로 길이가 0입니다.");
            stopSimulation();
            return;
        }

        // 상태 초기화
        wpsRef.current    = wps;
        geosRef.current   = geos;
        segLenRef.current = segLen;
        cumLenRef.current = cumLen;
        totalRef.current  = total;

        distRef.current   = 0;
        segIdxRef.current = 0;
        cancelRef.current = false;
        isRunningRef.current = true;

        // 시계 켜기 (★ 중요)
        wasAnimatingRef.current = viewer.clock.shouldAnimate;
        viewer.clock.shouldAnimate = true;

        // 시작 시 카메라 저장
        const cam = viewer.scene.camera;
        if (!savedCamRef.current) {
            savedCamRef.current = {
                destination: cam.positionWC.clone(),
                heading: cam.heading, pitch: cam.pitch, roll: cam.roll,
            };
        }

        // 출발 순간부터 첫 도착지점을 바라보도록 세팅
        const start   = wps[0];
        const segEnd  = wps[1];
        const heading = headingBetween(start, segEnd);
        const pose    = cameraPoseAt(viewer.scene, start, heading);
        cam.setView({ destination: pose.destination, orientation: pose.orientation });

        prevTimeRef.current = viewer.clock.currentTime;

        // onTick 등록 (가감속 없음)
        const handler = (clock: Cesium.Clock) => {
            if (!isRunningRef.current || cancelRef.current) return;

            const now = clock.currentTime;
            const prev = prevTimeRef.current ?? now;
            const dt = Math.max(0, Cesium.JulianDate.secondsDifference(now, prev));
            prevTimeRef.current = now;

            // 속도 = BASE × 배속 (실시간)
            const v = BASE_SPEED_MS * (speedMultRef.current || 1.0);

            // 누적 거리 선형 증가
            distRef.current = Math.min(totalRef.current, distRef.current + v * dt);

            // 현재 위치/heading 계산
            const ev = evalAlongPath(
                distRef.current,
                wpsRef.current, geosRef.current, segLenRef.current, cumLenRef.current,
                segIdxRef.current
            );
            segIdxRef.current = ev.currIdx;

            // 항상 현재 도착지점을 바라보며, 지면+2 m 유지
            const nextPose = cameraPoseAt(viewer.scene, ev.pos, ev.heading);
            viewer.scene.camera.setView({ destination: nextPose.destination, orientation: nextPose.orientation });

            // requestRender 모드에서도 다음 프레임 진행 보장
            try { requestRender(); } catch {}

            // 완료 처리
            if (distRef.current >= totalRef.current - 1e-6) {
                stopSimulation();
            }
        };

        tickHandlerRef.current = handler;
        viewer.clock.onTick.addEventListener(handler);
    }, [currentRoute, viewer]);

    /** 시뮬 정지 (원래 시점 복귀) */
    const stopSimulation = useCallback(() => {
        // onTick 해제
        if (tickHandlerRef.current) {
            viewer.clock.onTick.removeEventListener(tickHandlerRef.current);
            tickHandlerRef.current = null;
        }

        // 진행 중인 flyTo가 있었다면 중지(방어적)
        try { viewer.scene.camera.cancelFlight?.(); } catch {}

        isRunningRef.current = false;
        cancelRef.current    = true;

        // 시계 상태 복원 (★ 중요)
        viewer.clock.shouldAnimate = wasAnimatingRef.current;

        // 원래 시점 복귀
        const saved = savedCamRef.current;
        if (saved) {
            viewer.scene.camera.setView({
                destination: saved.destination,
                orientation: { heading: saved.heading, pitch: saved.pitch, roll: saved.roll }
            });
        }

        // 상태 초기화
        savedCamRef.current = null;
        prevTimeRef.current = null;
        distRef.current = 0;
        segIdxRef.current = 0;
    }, [viewer]);

    /** 토글 */
    const handleToggle = () => {
        if (isRunningRef.current) stopSimulation();
        else startSimulation();
    };

    return (
        <section className={defaultStyle.bottomSheet}>
            <div className={styles.listChips}>
                <Chip label={"뒤로가기"} activable={false} onClickAction={() => { stopSimulation(); router.back(); }} />
                <Chip label={isRunningRef.current ? "정지" : "시뮬레이션 시작"} onClickAction={handleToggle} />
                <Chip
                    label={"자동 경로"}
                    onClickAction={() => { dispatch(setAutomaticRoute(!automaticRoute)); }}
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
