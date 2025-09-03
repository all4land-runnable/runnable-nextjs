'use client';

import styles from "./DrawingController.module.css";
import React, {useEffect, useRef, useState} from "react";
import {remToPx} from "@/app/utils/claculator/pxToRem";
import workoutAvailabilityOnClick from "@/app/components/molecules/drawing-chips/drawing-controller-onclick/workoutAvailabilityOnClick";
import saveDrinkingFountainsInfoOnClick from "@/app/components/molecules/drawing-chips/drawing-controller-onclick/saveDrinkingFountainsInfoOnClick";
import {useModal} from "@/app/components/common/modal/ModalProvider";
import {completeDrawingOnClick} from "@/app/components/molecules/drawing-chips/drawing-controller-onclick/completeDrawingOnClick";
import circularRouteOnClick from "@/app/components/molecules/drawing-chips/drawing-controller-onclick/circularRouteOnClick";
import { useRouter } from "next/navigation";
import clearMarkers from "@/app/utils/markers/clearMarkers";
import drawingRoute, { removeDrawPolyline } from "./drawing/drawingRoute";
import {Chip, ChipParam} from "@/app/components/atom/chip/Chip";
import {getDrawer} from "@/app/components/templates/cesium/drawer/getDrawer";
import {drawMarkerEntities} from "@/app/staticVariables";

/**
 * 경로 그리기 컨트롤러 함수를 구현하는 함수
 * @constructor
 */
export default function DrawingController() {
    const router = useRouter();
    const { openConfirm, close } = useModal();
    const [ circular, setCircular ] = useState<boolean>(true);

    // 뒤로가기 버튼 선택 함수
    const closeDrawingController:ChipParam = {label: "뒤로 가기", backgroundColor: "#FF9F9F", fontSize: remToPx(1.125), toggle:false, onClick: closeOnClick}
    const workoutAvailability:ChipParam = {label: "운동 가능 시간", backgroundColor: "#FF9F9F", fontSize:remToPx(1.125), onClick: workoutAvailabilityOnClick}
    const saveDrinkingFountainsInfo:ChipParam = {label: "음수대 정보 표시", backgroundColor: "#FF9F9F", fontSize:remToPx(1.125), onClick: saveDrinkingFountainsInfoOnClick}
    const circularRoute:ChipParam = {label: "원형 경로", backgroundColor: "#FF9F9F", fontSize:remToPx(1.125), onClick: ()=>{
        circularRouteOnClick(circular).then()
        setCircular(!circular);
    }}
    const completeDrawing:ChipParam = {label: "경로 완성", backgroundColor: "#FF9F9F", fontSize:remToPx(1.125), onClick: () => {
        openConfirm({title: "경로 저장", content: "경로를 저장하시겠습니까?",
            onConfirm: ()=>{
                close();
                completeDrawingOnClick(drawMarkerEntities, circular).then();
                router.push('/route-save')
            },
            onCancel: close
        })
    }}

    // NOTE 1. 화면 생성 시 작동
    const initializedRef = useRef(false);
    useEffect(()=>{
        if (initializedRef.current) return;
        initializedRef.current = true;

        // 새 경로 그리기를 시작한다.
        drawingRoute(()=>{}).then();
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

    function closeOnClick(){
        getDrawer().then((drawer)=>{
            drawer.reset() // 그리기를 완료하지 않고, 초기화 했으면, 자동으로 종료된다.

            clearMarkers(drawMarkerEntities).then() // 기존에 그려진 경로 마커들을 제거한다.
            removeDrawPolyline().then(); // Polyline도 제거한다.

            router.back()
        }); // drawer 호출
    }
}