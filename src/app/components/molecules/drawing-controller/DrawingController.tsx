'use client';

import styles from "./DrawingController.module.css";
import {RoundButton} from "@/app/components/atom/round-button/RoundButton";
import React from "react";
import {remToPx} from "@/app/utils/pxToRem";
import {RouteChipsState} from "@/app/components/molecules/route-chips/RouteChips";
import closeDrawingControllerOnClick from "@/app/components/molecules/drawing-controller/drawing-controller-onclick/closeDrawingControllerOnClick";
import workoutAvailabilityOnClick from "@/app/components/molecules/drawing-controller/drawing-controller-onclick/workoutAvailabilityOnClick";
import drinkingFountainsInfoOnclick from "@/app/components/molecules/drawing-controller/drawing-controller-onclick/drinkingFountainsInfoOnclick";

export type DrawingControllerState = {
    openDrawingController: boolean,
    setOpenDrawingController: (open: boolean) => void
}

type DrawingControllerProps = {
    drawingControllerState: DrawingControllerState;
    routeChipsState: RouteChipsState;
};

export default function DrawingController({drawingControllerState, routeChipsState}:DrawingControllerProps) {
    const closeDrawingControllerHandler = () => closeDrawingControllerOnClick(drawingControllerState, routeChipsState);

    return (
        <div className={styles.drawingController} style={{ display: drawingControllerState.openDrawingController ? "flex" : "none" }}>
            <RoundButton roundButtonParam={{label: "뒤로 가기", backgroundColor: "#D9D9D9", fontSize: remToPx(0.75), toggle:false, onClick: closeDrawingControllerHandler}}/>
            <RoundButton roundButtonParam={{label: "운동 가능 시간", backgroundColor: "#D9D9D9", fontSize:remToPx(0.75), onClick: workoutAvailabilityOnClick}}/>
            <RoundButton roundButtonParam={{label: "음수대 정보 표시", backgroundColor: "#D9D9D9", fontSize:remToPx(0.75), onClick: drinkingFountainsInfoOnclick}}/>
        </div>
        )
}