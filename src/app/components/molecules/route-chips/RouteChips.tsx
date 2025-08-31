import styles from "./RouteChips.module.css";
import React from "react";
import {remToPx} from "@/app/utils/pxToRem";
import {Chip, ChipParam} from "@/app/components/atom/chip/Chip";
import {LeftSideBarState} from "@/app/components/templates/left-side-bar/LeftSideBar";
import {DrawingControllerState} from "@/app/components/molecules/drawing-controller/DrawingController";

export type RouteChipsState = {
    openRouteChips: boolean,
    setOpenRouteChips: (open: boolean) => void
}

type RouteChipsProps = {
    routeChipsState: RouteChipsState;
    drawingControllerState: DrawingControllerState;
    leftSideBarState: LeftSideBarState;
};

/**
 * 경로 관련 버튼을 구현하는 함수
 *
 * @param routeChipsState 경로 관련 버튼 확장 상태
 * @param drawingControllerState
 * @param leftSideBarState 왼쪽 사이드바 확장 상태
 * @constructor
 */
export default function RouteChips({routeChipsState, drawingControllerState, leftSideBarState}:RouteChipsProps) {
    // chip 버튼 속성 선언
    const createRoute: ChipParam = {label:"경로 생성", backgroundColor:"#FF9F9F", fontSize:remToPx(1.125), toggle:false, onClick:()=>{
            routeChipsState.setOpenRouteChips(false);
            drawingControllerState.setOpenDrawingController(true);
            // createRouteOnClick(); // TODO
        }}
    const routeList: ChipParam = {label:"경로 목록", backgroundColor:"#FF9F9F", fontSize:remToPx(1.125), onClick:()=>{
            leftSideBarState.setOpenLeftSideBar(!leftSideBarState.openLeftSideBar);
        }}

    return (
        <div className={styles.routeChips} style={{ display: routeChipsState.openRouteChips ? "flex" : "none" }}>
            <Chip chipParam={createRoute}/> {/* 경로 생성 */}
            <Chip chipParam={routeList}/> {/* 경로 목록 */}
        </div>
    )
}