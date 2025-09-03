'use client';

import styles from "./DrawingController.module.css";
import {RoundButton, RoundButtonParam} from "@/app/components/atom/round-button/RoundButton";
import React, {useState} from "react";
import {remToPx} from "@/app/utils/claculator/pxToRem";
import {RouteChipsState} from "@/app/components/molecules/route-chips/RouteChips";
import closeDrawingControllerOnClick from "@/app/components/molecules/drawing-controller/drawing-controller-onclick/closeDrawingControllerOnClick";
import workoutAvailabilityOnClick from "@/app/components/molecules/drawing-controller/drawing-controller-onclick/workoutAvailabilityOnClick";
import saveDrinkingFountainsInfoOnClick from "@/app/components/molecules/drawing-controller/drawing-controller-onclick/saveDrinkingFountainsInfoOnClick";
import {useModal} from "@/app/components/common/modal/ModalProvider";
import {completeDrawingOnClick} from "@/app/components/molecules/drawing-controller/drawing-controller-onclick/completeDrawingOnClick";
import {drawMarkerEntities} from "@/app/components/molecules/drawing-controller/drawing/upsertDrawMarkers";
import circularRouteOnClick from "@/app/components/molecules/drawing-controller/drawing-controller-onclick/circularRouteOnClick";

/**
 * 경로 그리기 컨트롤러 확장 상태
 *
 * @param openDrawingController 경로 그리기 컨트롤러 확장 상태
 * @param setOpenDrawingController 경로 그리기 컨트롤러 확장 상태 변경
 */
export type DrawingControllerState = {
    openDrawingController: boolean,
    setOpenDrawingController: (open: boolean) => void
}

type DrawingControllerProps = {
    drawingControllerState: DrawingControllerState;
    routeChipsState: RouteChipsState;
};

/**
 * 경로 그리기 컨트롤러 함수를 구현하는 함수
 *
 * @param drawingControllerState 경로 그리기 컨트롤러 확장 상태
 * @param routeChipsState 경로 관련 버튼 확장 상태
 * @constructor
 */
export default function DrawingController({drawingControllerState, routeChipsState}:DrawingControllerProps) {
    const { openConfirm, close } = useModal();
    const [ circular, setCircular ] = useState<boolean>(false);

    // 뒤로가기 버튼 선택 함수
    const closeDrawingController:RoundButtonParam = {label: "뒤로 가기", backgroundColor: "#D9D9D9", fontSize: remToPx(0.75), toggle:false, onClick: () => closeDrawingControllerOnClick(drawingControllerState, routeChipsState)}
    const workoutAvailability:RoundButtonParam = {label: "운동 가능 시간", backgroundColor: "#D9D9D9", fontSize:remToPx(0.75), onClick: workoutAvailabilityOnClick}
    const saveDrinkingFountainsInfo:RoundButtonParam = {label: "음수대 정보 표시", backgroundColor: "#D9D9D9", fontSize:remToPx(0.75), onClick: saveDrinkingFountainsInfoOnClick}
    const circularRoute:RoundButtonParam = {label: "원형 경로", backgroundColor: "#D9D9D9", fontSize:remToPx(0.75), toggle:true, onClick: ()=>{
        circularRouteOnClick(circular).then()
        setCircular(!circular);
    }}
    const completeDrawing:RoundButtonParam = {label: "경로 완성", backgroundColor: "#D9D9D9", fontSize:remToPx(0.75), onClick: () => {
        openConfirm({title: "경로 저장", content: "경로를 저장하시겠습니까?",
            onConfirm: ()=>{
                close();
                completeDrawingOnClick(drawMarkerEntities, circular).then();
            },
            onCancel: close
        })
    }}

    return (
        <div className={styles.drawingController} style={{ display: drawingControllerState.openDrawingController ? "flex" : "none" }}>
            <RoundButton roundButtonParam={closeDrawingController}/> {/* 뒤로가기 */}
            <RoundButton roundButtonParam={workoutAvailability}/> {/* 운동 가능 시간 */}
            <RoundButton roundButtonParam={saveDrinkingFountainsInfo}/> {/* 음수대 정보 표시 */}
            <RoundButton roundButtonParam={circularRoute}/> {/* 원형 경로 표시 */}
            <RoundButton roundButtonParam={completeDrawing}/> {/* 경로 완성 */}
        </div>
    )
}