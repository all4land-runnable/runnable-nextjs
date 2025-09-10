'use client';

import styles from "./DrawingController.module.css";
import React, {useEffect, useState} from "react";
import {remToPx} from "@/app/utils/claculator/pxToRem";
import {useModal} from "@/app/components/common/modal/ModalProvider";
import {completeDrawingOnClick} from "@/app/components/molecules/drawing-chips/drawing-controller-onclick/completeDrawingOnClick";
import { useRouter } from "next/navigation";
import drawingTempRoute, { removeTempRoute } from "./drawing/drawingTempRoute";
import {Chip} from "@/app/components/atom/chip/Chip";
import {addCircular, removeCircular} from "@/app/components/molecules/drawing-chips/drawing-controller-onclick/circularRouteOnClick";
import {getCircularHelper, getTempRoute} from "@/app/staticVariables";
import getDrawer from "@/app/components/templates/cesium/drawer/getDrawer";
import workoutAvailabilityOnClick from "@/app/components/molecules/drawing-chips/drawing-controller-onclick/workoutAvailabilityOnClick";
import saveDrinkingFountainsInfoOnClick from "@/app/components/molecules/drawing-chips/drawing-controller-onclick/saveDrinkingFountainsInfoOnClick";

/**
 * 경로 그리기 컨트롤러 함수를 구현하는 함수
 * @constructor
 */
export default function DrawingChips() {
    const router = useRouter();
    const { openConfirm, close } = useModal();
    const [ circular, setCircular ] = useState<boolean>(true);

    // 뒤로가기 버튼 선택 함수
    const closeDrawingController = ()=>{
        removeDrawingRoute();
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
                const tempRoute = getTempRoute()
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

    // NOTE 2. UI 구현
    return (
        <div className={styles.drawingController}>
            <Chip label={"뒤로 가기"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} activable={false} onClickAction={closeDrawingController}/> {/* 뒤로가기 */}
            <Chip label={"운동 가능 시간"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} onClickAction={workoutAvailabilityOnClick}/> {/* 운동 가능 시간 */}
            <Chip label={"음수대 정보 표시"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} onClickAction={saveDrinkingFountainsInfoOnClick}/> {/* 음수대 정보 표시 */}
            <Chip label={"원형 경로"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} onClickAction={circularRoute}/> {/* 원형 경로 표시 */}
            <Chip label={"경로 완성"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} onClickAction={completeDrawing}/> {/* 경로 완성 */}
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