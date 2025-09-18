'use client';

import React, {useEffect, useState} from "react";
import defaultStyle from '@/app/page.module.scss'
import styles from './page.module.scss'
import RouteOptionSlider from "@/app/components/molecules/route-option-slider/RouteOptionSlider";
import {formatKm} from "@/app/utils/claculator/formatKm";
import {formatKg} from "@/app/utils/claculator/formatKg";
import {formatPace} from "@/app/utils/claculator/formatPace";
import {CHIP_TYPE, ChipButton} from "@/app/components/atom/ChipButton";
import {useRouter} from "next/navigation";
import {useModal} from "@/app/store/modal/ModalProvider";
import {getTempEntity, getTempRouteMarkers, setTempEntity} from "@/app/staticVariables";
import getDrawer from "@/app/components/organisms/cesium/drawer/getDrawer";
import workoutAvailabilityOnClick from "@/app/utils/drawing-chips/drawing-controller-onclick/workoutAvailabilityOnClick";
import saveDrinkingFountainsInfoOnClick from "@/app/utils/drawing-chips/drawing-controller-onclick/saveDrinkingFountainsInfoOnClick";
import {setRightSidebarOpen} from "@/app/store/redux/feature/rightSidebarSlice";
import {useDispatch} from "react-redux";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";
import * as Cesium from "cesium";
import {Entity} from "cesium";
import {removeTempRoute} from "@/app/pages/route-drawing/utils/drawingTempRoute";
import requestRender from "@/app/components/organisms/cesium/util/requestRender";
import upsertTempRoute from "@/app/pages/route-drawing/utils/upsertTempRoute";
import {resetRouteDrawing, setPedestrianRoute, setTempRoute} from "@/app/store/redux/feature/routeDrawingSlice";
import {parseTempRoute} from "@/app/pages/route-drawing/utils/parseTempRoute";
import {parsePedestrianRoute} from "@/app/pages/route-drawing/utils/parsePedestrianRoute";
import {addPedestrianEntity} from "@/app/pages/route-drawing/utils/addPedestrianEntity";
import {entitiesToLngLat, getPedestrianRoute} from "@/app/pages/route-drawing/utils/postPedestrianRoute";
import {getTempPolyline} from "@/app/pages/route-drawing/utils/getTempPolyline";
import {getCircularPolyline} from "@/app/pages/route-drawing/utils/getCircularPolyline";
import changeAltitude from "@/app/utils/tile-chips/altitude-onclick/changeAltitude";

/**
 * 홈 화면을 구현하는 함수
 * @constructor
 */
export default function Page() {
    const router = useRouter();
    const dispatch = useDispatch()
    const viewer = getViewer();
    const drawer = getDrawer();

    const [limitActive, setLimitActive] = useState<boolean>(false); // 거리 제한(meter)
    const [limitRange, setLimitRange] = useState<number>(5);
    const [luggageActive, setLuggageActive] = useState(false); // 짐 무게 (kg)
    const [luggageWeight, setLuggageWeight] = useState(0);
    const [paceActive, setPaceActive] = useState(false); // 희망 속도
    const [paceSeconds, setPaceSeconds] = useState(0);
    const { openConfirm, close } = useModal();
    const [ circular, setCircular ] = useState<boolean>(false);
    const [altitudeActive, setAltitudeActive] = useState<boolean>(false);
    const [altitude, setAltitude] = useState<number>(0.3); // [0..1] normalized

    /**
     * 이전 페이지로 되돌아가는 함수
     */
    const returnPage = ()=>{
        dispatch(setRightSidebarOpen(false));
        try{
            drawer.reset()
            try {
                if(circular) removeCircular()
            }catch{}
            removeTempRoute();
        } catch{}
        router.back();
    }

    /**
     * 경로 확정 완료 전 알림 전송
     */
    const completeDrawing= () => {
        openConfirm({
            title: "경로 저장",
            content: "경로를 저장하시겠습니까?",
            onConfirm: async ()=>{
                const tempEntityMarkers: Entity[] = getTempRouteMarkers();
                getTempPolyline(tempEntityMarkers, getTempEntity(), circular)

                const tempRoute = await parseTempRoute(tempEntityMarkers);
                dispatch(setTempRoute(tempRoute));

                const pedestrianResponse = await getPedestrianRoute(entitiesToLngLat(tempEntityMarkers));

                const pedestrianEntity = addPedestrianEntity(pedestrianResponse);
                viewer.entities.add(pedestrianEntity);

                const pedestrianRoute = await parsePedestrianRoute(pedestrianEntity, pedestrianResponse);
                dispatch(setPedestrianRoute(pedestrianRoute));

                close();
                router.push(`/pages/route-save/${luggageWeight}/${paceSeconds}`);
            },
            onCancel: close
        })
    }

    const circularRoute = () => {
        setCircular(prev => !prev);
        if (!circular) addCircular(); else removeCircular();
    };

    const addCircular = () => {
        setCircular(true);
        const tempEntities = getTempRouteMarkers();
        if (!tempEntities || tempEntities.length < 2) {
            alert("최소한 두개의 지점을 선택해주세요.");
            return;
        }
        getCircularPolyline()
    };

    const removeCircular = ()=>{
        setCircular(false);
        viewer.entities.removeById("circular_line");
        requestRender()
    };

    // 처음 페이지에 들어오면 자동으로 그리기 시작
    useEffect(()=>{
        dispatch(resetRouteDrawing())
        drawer.start({
            type: "POLYLINE",
            once: true,
            finalOptions: {
                width: 10,
                material: Cesium.Color.RED,
                clampToGround: true,
            },
            onPointsChange: (points) => {
                upsertTempRoute(points);
                requestRender()
            },
            onEnd: (entity) => {
                setTempEntity(entity.id)
                requestRender()
            }
        });
    }, [dispatch, drawer])

    // ✅ 고도 슬라이더 실시간 반영/토글
    useEffect(() => {
        const globe = viewer.scene.globe;
        if (!altitudeActive) {
            if (globe.material?.type === "ElevationColorContour") {
                globe.material = undefined;
                requestRender();
            }
            return;
        }
        // 활성화: 현재 값으로 즉시 적용/업데이트
        changeAltitude(altitude);
    }, [altitudeActive, altitude, viewer]);

    return (
        <>
            <section className={defaultStyle.bottomSheet}>
                <div className={styles.drawingController}>
                    <ChipButton label={"뒤로 가기"} type={CHIP_TYPE.CLICK} selectAction={returnPage}/>
                    <ChipButton label={"운동 가능 시간"} selectAction={workoutAvailabilityOnClick}/>
                    <ChipButton label={"음수대 정보 표시"} selectAction={saveDrinkingFountainsInfoOnClick}/>
                    <ChipButton label={"원형 경로"} selectAction={circularRoute}/>
                    <ChipButton label={"경로 완성"} type={CHIP_TYPE.CLICK} selectAction={completeDrawing}/>
                </div>
            </section>

            <div className={styles.routeOptions}>
                <RouteOptionSlider
                    label={"고도 표시"}
                    value={altitude}
                    formatValue={normalizedToAltitude(altitude, { viewer, fallback: { min: -5, max: 40 } }).toFixed(2)}
                    min={0.0} max={0.85} step={0.01}
                    active={altitudeActive}
                    onSlideAction={setAltitude}
                    onToggleAction={setAltitudeActive}
                    optionButtons={[ { name: "서울 평균", value: 0.0} ]}
                />
                <RouteOptionSlider
                    label="거리 제한"
                    value={limitRange}
                    formatValue={formatKm(limitRange)}
                    min={0} max={42200} step={100}
                    active={limitActive}
                    onSlideAction={setLimitRange}
                    onToggleAction={setLimitActive}
                    optionButtons={[
                        { name: "5km", value: 5000 },
                        { name: "10km", value: 10000 },
                        { name: "20km", value: 20000 },
                    ]}
                />
                <RouteOptionSlider
                    label="짐 무게"
                    value={luggageWeight}
                    formatValue={formatKg(luggageWeight*1000)}
                    min={0} max={15} step={0.5}
                    active={luggageActive}
                    onSlideAction={setLuggageWeight}
                    onToggleAction={setLuggageActive}
                    optionButtons={[
                        { name: "2kg", value: 2.0 },
                        { name: "5kg", value: 5.0 },
                        { name: "10kg", value: 10.0 },
                    ]}
                />
                <RouteOptionSlider
                    label="희망 속도"
                    value={paceSeconds}
                    formatValue={formatPace(paceSeconds)}
                    min={180} max={560} step={5}
                    active={paceActive}
                    onSlideAction={setPaceSeconds}
                    onToggleAction={setPaceActive}
                    optionButtons={[
                        { name: "5'30''", value: 330 },
                        { name: "6'00''", value: 360 },
                        { name: "6'30''", value: 390 },
                    ]}
                />
            </div>
        </>
    )
}

/** 현재 글로브의 ElevationRamp 범위를 읽기 (없으면 null) */
function getElevationRampRange(viewer: Cesium.Viewer):
    | { min: number; max: number }
    | null {
    const mat = viewer.scene.globe.material as Cesium.Material | undefined;
    if (!mat || mat.type !== "ElevationColorContour") return null;

    const sub = mat.materials?.elevationRampMaterial as Cesium.Material | undefined;
    const min = sub?.uniforms?.minimumHeight;
    const max = sub?.uniforms?.maximumHeight;
    return (typeof min === "number" && typeof max === "number")
        ? { min, max }
        : null;
}

/** [0..1] 정규값 → 고도(m) */
export function normalizedToAltitude(
    norm: number,
    opts:
        | { min: number; max: number }
        | { viewer: Cesium.Viewer; fallback?: { min: number; max: number } }
): number {
    const t = Math.min(1, Math.max(0, norm));

    let min: number, max: number;
    if ("viewer" in opts) {
        const range = getElevationRampRange(opts.viewer) ?? opts.fallback;
        if (!range) throw new Error("ElevationRamp 범위를 찾을 수 없습니다. (viewer/fallback 확인)");
        ({ min, max } = range);
    } else {
        ({ min, max } = opts);
    }

    if (max === min) return min;
    if (max < min) [min, max] = [max, min];

    return min + t * (max - min);
}
