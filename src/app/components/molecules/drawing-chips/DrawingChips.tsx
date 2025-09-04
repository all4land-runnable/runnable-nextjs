'use client';

import styles from "./DrawingController.module.css";
import React, {useEffect, useState} from "react";
import {remToPx} from "@/app/utils/claculator/pxToRem";
import workoutAvailabilityOnClick from "@/app/components/molecules/drawing-chips/drawing-controller-onclick/workoutAvailabilityOnClick";
import saveDrinkingFountainsInfoOnClick from "@/app/components/molecules/drawing-chips/drawing-controller-onclick/saveDrinkingFountainsInfoOnClick";
import {useModal} from "@/app/components/common/modal/ModalProvider";
import {completeDrawingOnClick} from "@/app/components/molecules/drawing-chips/drawing-controller-onclick/completeDrawingOnClick";
import { useRouter } from "next/navigation";
import drawingTempRoute, { removeTempRoute } from "./drawing/drawingTempRoute";
import {Chip, ChipParam} from "@/app/components/atom/chip/Chip";
import {addCircular, removeCircular} from "@/app/components/molecules/drawing-chips/drawing-controller-onclick/circularRouteOnClick";
import {getCircularHelper, getTempRoute} from "@/app/staticVariables";
import getDrawer from "@/app/components/templates/cesium/drawer/getDrawer";

/**
 * 경로 그리기 컨트롤러 함수를 구현하는 함수
 * @constructor
 */
export default function DrawingChips() {
    const router = useRouter();
    const { openConfirm, close } = useModal();
    const [ circular, setCircular ] = useState<boolean>(true);

    // 뒤로가기 버튼 선택 함수
    const closeDrawingController:ChipParam = {label: "뒤로 가기", backgroundColor: "#FF9F9F", fontSize: remToPx(1.125), toggle:false, onClick: ()=>{
        removeDrawingRoute();
        router.back();
    }}
    const workoutAvailability:ChipParam = {label: "운동 가능 시간", backgroundColor: "#FF9F9F", fontSize:remToPx(1.125), onClick: workoutAvailabilityOnClick}
    const saveDrinkingFountainsInfo:ChipParam = {label: "음수대 정보 표시", backgroundColor: "#FF9F9F", fontSize:remToPx(1.125), onClick: saveDrinkingFountainsInfoOnClick}
    const circularRoute:ChipParam = {label: "원형 경로", backgroundColor: "#FF9F9F", fontSize:remToPx(1.125), onClick: ()=>{
        circular? addCircular(): removeCircular()
        setCircular(!circular);
    }}
    const completeDrawing:ChipParam = {label: "경로 완성", backgroundColor: "#FF9F9F", fontSize:remToPx(1.125), onClick: () => {
        openConfirm({title: "경로 저장", content: "경로를 저장하시겠습니까?",
            onConfirm: ()=>{
                const tempRoute = getTempRoute()
                close();

                completeDrawingOnClick(tempRoute, circular).then(() => {
                    router.push('/pages/route-save')
                });
            },
            onCancel: close
        })
    }}

    // NOTE 1. 처음 화면 생성 시 작동
    useEffect(()=>{
        // 새 경로 그리기를 시작한다.
        drawingTempRoute(()=>{}).then();
    }, [])

    // NOTE 2. UI 구현
    return (
        <div className={styles.drawingController}>
            <Chip chipParam={closeDrawingController}/> {/* 뒤로가기 */}
            <Chip chipParam={workoutAvailability}/> {/* 운동 가능 시간 */}
            <Chip chipParam={saveDrinkingFountainsInfo}/> {/* 음수대 정보 표시 */}
            <Chip chipParam={circularRoute}/> {/* 원형 경로 표시 */}
            <Chip chipParam={completeDrawing}/> {/* 경로 완성 */}
        </div>
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