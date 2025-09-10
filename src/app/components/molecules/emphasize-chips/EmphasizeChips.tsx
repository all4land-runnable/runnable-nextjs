import styles from './emphasizeChips.module.css'
import React from "react";
import {remToPx} from "@/app/utils/claculator/pxToRem";
import {Chip} from "@/app/components/atom/chip/Chip";
import popularCourseOnClick from "@/app/components/molecules/emphasize-chips/emphasize-onclick/popularCourseOnClick";
import storageBoxOnClick from "@/app/components/molecules/emphasize-chips/emphasize-onclick/storageBoxOnClick";
import clearMarkers from "@/app/utils/markers/clearMarkers";
import {crosswalkOnClick} from "@/app/components/molecules/emphasize-chips/emphasize-onclick/crosswalkOnClick";
import {hospitalOnClick} from "@/app/components/molecules/emphasize-chips/emphasize-onclick/hospitalOnClick";
import {drinkingFountainOnClick} from "@/app/components/molecules/emphasize-chips/emphasize-onclick/drinkingFountainOnClick";
import {toggleSidewalkVisible} from "@/app/components/molecules/emphasize-chips/emphasize-onclick/sidewalkOnClick";
import {getCrosswalk, getDrinkingFoundation, getHospital} from "@/app/staticVariables";

/**
 * 구역 강조 버튼을 구현하는 함수
 * @constructor
 */
export default function EmphasizeChips() {
    return (
        <div className={styles.emphasizeChips}>
            <Chip label={"인기 코스"} backgroundColor={"#A1F0CB"} fontSize={remToPx(1.125)} onClickAction={popularCourseOnClick}/> {/* 인기 코스 */}
            <Chip label={"도보 경로"} backgroundColor={"#A1F0CB"} fontSize={remToPx(1.125)} onClickAction={toggleSidewalkVisible}/> {/* 횡단보도 */}
            <Chip label={"횡단보도"} backgroundColor={"#A1F0CB"} fontSize={remToPx(1.125)} onClickAction={crosswalkOnClick} inActiveOnClickAction={async ()=>clearMarkers(getCrosswalk())} /> {/* 도보 경로 */}
            <Chip label={"물품보관함"} backgroundColor={"#A1F0CB"} fontSize={remToPx(1.125)} onClickAction={storageBoxOnClick}/> {/* 물품보관함 */}
            <Chip label={"병원"} backgroundColor={"#A1F0CB"} fontSize={remToPx(1.125)} onClickAction={hospitalOnClick} inActiveOnClickAction={async ()=>clearMarkers(getHospital())}/> {/* 병원 */}
            <Chip label={"음수대"} backgroundColor={"#A1F0CB"} fontSize={remToPx(1.125)} onClickAction={drinkingFountainOnClick} inActiveOnClickAction={async ()=>clearMarkers(getDrinkingFoundation())}/> {/* 음수대 */}
        </div>
    )
}
