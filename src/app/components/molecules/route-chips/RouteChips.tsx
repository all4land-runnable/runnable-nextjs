import styles from "./RouteChips.module.css";
import React from "react";
import {remToPx} from "@/app/utils/pxToRem";
import Chip, {ChipParam} from "@/app/components/atom/chip/Chip";
import {LeftSideBarState} from "@/app/components/templates/left-side-bar/LeftSideBar";

type RouteChipsProps = {
    leftSideBarState: LeftSideBarState;
};

/**
 * 경로 관련 버튼을 구현하는 함수
 *
 * @param leftSideBarState 왼쪽 사이드바 확장 상태
 * @constructor
 */
export default function RouteChips({leftSideBarState}:RouteChipsProps) {
    // chip 버튼 속성 선언
    const createRoute: ChipParam = {label:"경로 생성", backgroundColor:"#FF9F9F", fontSize:remToPx(1.125), onClick:()=>{}}
    const routeList: ChipParam = {label:"경로 목록", backgroundColor:"#FF9F9F", fontSize:remToPx(1.125), onClick:()=>{
            leftSideBarState.setOpenLeftSideBar(!leftSideBarState.openLeftSideBar);
        }}

    return (
        <div className={styles.routeChips}>
            <Chip chipParam={createRoute}/> {/* 경로 생성 */}
            <Chip chipParam={routeList}/> {/* 경로 목록 */}
        </div>
    )
}