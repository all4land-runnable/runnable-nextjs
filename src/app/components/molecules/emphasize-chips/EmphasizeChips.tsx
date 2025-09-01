import styles from './emphasizeChips.module.css'
import React from "react";
import {remToPx} from "@/app/utils/pxToRem";
import {Chip, ChipParam} from "@/app/components/atom/chip/Chip";
import {hospitalOnClick} from "@/app/components/molecules/emphasize-chips/emphasize-onclick/hospitalOnClick";
import popularCourseOnClick from "@/app/components/molecules/emphasize-chips/emphasize-onclick/popularCourseOnClick";
import drinkingFountainOnClick from "@/app/components/molecules/emphasize-chips/emphasize-onclick/drinkingFountainOnClick";
import crosswalkOnClick from "@/app/components/molecules/emphasize-chips/emphasize-onclick/crosswalkOnClick";
import storageBoxOnClick from "@/app/components/molecules/emphasize-chips/emphasize-onclick/storageBoxOnClick";
import {sidewalkOnClick} from "@/app/components/molecules/emphasize-chips/emphasize-onclick/sidewalkOnClick";

/**
 * 구역 강조 버튼을 구현하는 함수
 * @constructor
 */
export default function EmphasizeChips() {
    // chip 버튼 속성 선언
    const popularCourse:ChipParam = { label:"인기 코스", backgroundColor:"#A1F0CB", fontSize:remToPx(1.125), onClick: popularCourseOnClick};
    const crosswalk:ChipParam = {label:"횡단보도", backgroundColor:"#A1F0CB", fontSize:remToPx(1.125), onClick: crosswalkOnClick};
    const sidewalk:ChipParam = {label:"도보 경로", backgroundColor:"#A1F0CB", fontSize:remToPx(1.125), onClick: sidewalkOnClick};
    const storageBox:ChipParam = {label:"물품보관함", backgroundColor:"#A1F0CB", fontSize:remToPx(1.125), onClick: storageBoxOnClick};
    const hospital:ChipParam = { label:"병원", backgroundColor:"#A1F0CB", fontSize:remToPx(1.125), onClick: hospitalOnClick };
    const drinkingFountain:ChipParam = {label:"음수대", backgroundColor:"#A1F0CB", fontSize:remToPx(1.125), onClick: drinkingFountainOnClick };

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
