import styles from "./TileChips.module.css";
import React from "react";
import {remToPx} from "@/app/utils/pxToRem";
import {Chip, ChipParam} from "@/app/components/atom/chip/Chip";
import altitudeOnClick from "@/app/components/molecules/tile-chips/title-onclick/altitudeOnClick";

/**
 * 타일 버튼을 구현하는 함수
 *
 * @constructor
 */
export default function TileChips() {
    // chip 버튼 속성 선언
    const altitude: ChipParam = {label:"고도 표시", backgroundColor:"#FCDE8C", fontSize:remToPx(1.125), onClick:()=> {
            void altitudeOnClick();
        }}
    const texture: ChipParam = {label:"재질 표시", backgroundColor:"#FCDE8C", fontSize:remToPx(1.125), onClick:()=>{}}
    const temperature: ChipParam = {label:"온도 측정", backgroundColor:"#FCDE8C", fontSize:remToPx(1.125), onClick:()=>{}}

    return (
        <div className={styles.tileChips}>
            <Chip chipParam={altitude}/> {/* 고도 표시 */}
            <Chip chipParam={texture}/> {/* 재질 표시 */}
            <Chip chipParam={temperature}/> {/* 온도 측정 */}
        </div>
    )
}