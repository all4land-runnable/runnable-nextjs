'use client';

import styles from "./DrawingController.module.css";
import {RoundButton} from "@/app/components/atom/round-button/RoundButton";
import React from "react";
import {remToPx} from "@/app/utils/claculator/pxToRem";
import {RouteChipsState} from "@/app/components/molecules/route-chips/RouteChips";
import closeDrawingControllerOnClick from "@/app/components/molecules/drawing-controller/drawing-controller-onclick/closeDrawingControllerOnClick";
import workoutAvailabilityOnClick from "@/app/components/molecules/drawing-controller/drawing-controller-onclick/workoutAvailabilityOnClick";
import saveDrinkingFountainsInfoOnclick from "@/app/components/molecules/drawing-controller/drawing-controller-onclick/saveDrinkingFountainsInfoOnclick";

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
    // 뒤로가기 버튼 선택 함수
    const closeDrawingControllerHandler = () => closeDrawingControllerOnClick(drawingControllerState, routeChipsState);

    return (
        <div className={styles.drawingController} style={{ display: drawingControllerState.openDrawingController ? "flex" : "none" }}>
            <RoundButton roundButtonParam={{label: "뒤로 가기", backgroundColor: "#D9D9D9", fontSize: remToPx(0.75), toggle:false, onClick: closeDrawingControllerHandler}}/> {/* 뒤로가기 */}
            <RoundButton roundButtonParam={{label: "운동 가능 시간", backgroundColor: "#D9D9D9", fontSize:remToPx(0.75), onClick: workoutAvailabilityOnClick}}/> {/* 운동 가능 시간 */}
            <RoundButton roundButtonParam={{label: "음수대 정보 표시", backgroundColor: "#D9D9D9", fontSize:remToPx(0.75), onClick: saveDrinkingFountainsInfoOnclick}}/> {/* 음수대 정보 표시 */}
        </div>
    )
}