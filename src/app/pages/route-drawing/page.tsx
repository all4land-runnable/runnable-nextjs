'use client';

import React, {useEffect, useState} from "react";
import styles from './page.module.css'
import RouteOptionSlider from "@/app/components/molecules/route-option-slider/RouteOptionSlider";
import {formatKm} from "@/app/utils/claculator/formatKm";
import {formatKg} from "@/app/utils/claculator/formatKg";
import {formatPace} from "@/app/utils/claculator/formatPace";
import {Chip} from "@/app/components/atom/chip/Chip";
import {remToPx} from "@/app/utils/claculator/pxToRem";
import {useRouter} from "next/navigation";
import {useModal} from "@/app/store/modal/ModalProvider";
import {getCircularHelper, getTempEntity} from "@/app/staticVariables";
import getDrawer from "@/app/components/organisms/cesium/drawer/getDrawer";
import {addCircular, removeCircular} from "@/app/utils/drawing-chips/drawing-controller-onclick/circularRouteOnClick";
import {completeDrawingOnClick} from "@/app/utils/drawing-chips/drawing-controller-onclick/completeDrawingOnClick";
import drawingTempRoute, {removeTempRoute} from "@/app/utils/drawing-chips/drawing/drawingTempRoute";
import workoutAvailabilityOnClick
    from "@/app/utils/drawing-chips/drawing-controller-onclick/workoutAvailabilityOnClick";
import saveDrinkingFountainsInfoOnClick
    from "@/app/utils/drawing-chips/drawing-controller-onclick/saveDrinkingFountainsInfoOnClick";
import {setRightSidebarOpen} from "@/app/store/redux/feature/rightSidebarSlice";
import {useDispatch} from "react-redux";

/**
 * 홈 화면을 구현하는 함수
 * @constructor
 */
export default function Page() {
    const dispatch = useDispatch()

    // 거리 제한(meter)
    const [limitActive, setLimitActive] = useState<boolean>(false);
    const [limitRange, setLimitRange] = useState<number>(5);

    // 짐 무게 (kg)
    const [luggageActive, setLuggageActive] = useState(false);
    const [luggageWeight, setLuggageWeight] = useState(1.5);

    // 희망 속도 (분/㎞를 초로 가정: 180(3'00") ~ 480(8'00"))
    const [paceActive, setPaceActive] = useState(false);
    const [paceSeconds, setPaceSeconds] = useState(360); // 6'00" = 360초

    const router = useRouter();
    const { openConfirm, close } = useModal();
    const [ circular, setCircular ] = useState<boolean>(true);

    // 뒤로가기 버튼 선택 함수
    const closeDrawingController = ()=>{
        dispatch(setRightSidebarOpen(false));

        try{
            removeDrawingRoute();
        } catch{}
        router.back();
    }
    const circularRoute = () => {
        if (circular) addCircular();
        else removeCircular();
        setCircular((prev) => !prev);
    };
    const completeDrawing= () => {
        openConfirm({title: "경로 저장", content: "경로를 저장하시겠습니까?",
            onConfirm: ()=>{
                const tempRoute = getTempEntity()
                close();

                completeDrawingOnClick(tempRoute, circular).then(() => {
                    router.push('/pages/route-save')
                });
            },
            onCancel: close
        })
    }

    // NOTE 1. 처음 화면 생성 시 작동
    useEffect(()=>{
        // 새 경로 그리기를 시작한다.
        drawingTempRoute(()=>{}).then();
    }, [])

    return (
        <>
            <section className={styles.bottomSheet}>
                <div className={styles.drawingController}>
                    <Chip label={"뒤로 가기"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} activable={false} onClickAction={closeDrawingController}/>
                    <Chip label={"운동 가능 시간"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} onClickAction={workoutAvailabilityOnClick}/>
                    <Chip label={"음수대 정보 표시"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} onClickAction={saveDrinkingFountainsInfoOnClick}/>
                    <Chip label={"원형 경로"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} onClickAction={circularRoute}/>
                    <Chip label={"경로 완성"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} activable={false} onClickAction={completeDrawing}/>
                </div>
            </section>

            <div className={styles.routeOptions}>
                <RouteOptionSlider label="거리 제한" value={limitRange} formatValue={formatKm(limitRange)} min={0} max={50} step={0.1} active={limitActive} onSlideAction={setLimitRange} onToggleAction={setLimitActive}/>
                <RouteOptionSlider label="짐 무게" value={luggageWeight} formatValue={formatKg(luggageWeight*1000)} min={0} max={20} step={1} active={luggageActive} onSlideAction={setLuggageWeight} onToggleAction={setLuggageActive}/>
                <RouteOptionSlider label="희망 속도" value={paceSeconds} formatValue={formatPace(paceSeconds)} min={180} max={600} step={5} active={paceActive} onSlideAction={setPaceSeconds} onToggleAction={setPaceActive}/>
            </div>
        </>
    )
}

function removeDrawingRoute(){
    getDrawer().reset() // 그리기를 완료하지 않고, 초기화 했으면, 자동으로 종료된다.
    try {
        if(getCircularHelper())
            removeCircular()
    }catch{}
    removeTempRoute(); // Polyline도 제거한다.
}
