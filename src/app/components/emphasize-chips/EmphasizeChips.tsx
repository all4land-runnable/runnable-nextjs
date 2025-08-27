import styles from './emphasizeChips.module.css'
import Chip, {ChipParam} from "@/app/components/chip/Chip";
import React from "react";
import {remToPx} from "@/app/utils/pxToRem";

/**
 * 구역 강조 버튼을 구현하는 함수
 * @constructor
 */
export default function EmphasizeChips() {
    // chip 버튼 속성 선언
    const popularCourse:ChipParam = {label:"인기 코스", backgroundColor:"#A1F0CB", fontSize:remToPx(1.125), onClick:()=>{
            alert("개발중: 인기 코스 데이터가 없습니다.");
        }};
    const crosswalk:ChipParam = {label:"횡단보도", backgroundColor:"#A1F0CB", fontSize:remToPx(1.125), onClick:()=>{}};
    const sidewalk:ChipParam = {label:"도보 경로", backgroundColor:"#A1F0CB", fontSize:remToPx(1.125), onClick:()=>{}};
    const storageBox:ChipParam = {label:"물품보관함", backgroundColor:"#A1F0CB", fontSize:remToPx(1.125), onClick:()=>{}};
    const hospital:ChipParam = {label:"병원", backgroundColor:"#A1F0CB", fontSize:remToPx(1.125), onClick:()=>{}};
    const drinkingFountain:ChipParam = {label:"음수대", backgroundColor:"#A1F0CB", fontSize:remToPx(1.125), onClick:()=>{}};

    return (
        <div className={styles.emphasizeChips}>
            <Chip chipParam={popularCourse}/> {/* 인기 코스 */}
            <Chip chipParam={crosswalk}/> {/* 횡단보도 */}
            <Chip chipParam={sidewalk}/> {/* 도보 경로 */}
            <Chip chipParam={storageBox}/> {/* 물품보관함 */}
            <Chip chipParam={hospital}/> {/* 병원 */}
            <Chip chipParam={drinkingFountain}/> {/* 음수대 */}
        </div>
    )
}