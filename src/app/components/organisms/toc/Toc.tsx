'use client';

import styles from "./Toc.module.css";
import {Chip} from "@/app/components/atom/chip/Chip";
import popularCourseOnClick from "@/app/utils/emphasize-chips/emphasize-onclick/popularCourseOnClick";
import {toggleSidewalkVisible} from "@/app/utils/emphasize-chips/emphasize-onclick/sidewalkOnClick";
import {crosswalkOnClick} from "@/app/utils/emphasize-chips/emphasize-onclick/crosswalkOnClick";
import clearMarkers from "@/app/utils/markers/clearMarkers";
import {getCrosswalk, getDrinkingFoundation, getHospital} from "@/app/staticVariables";
import storageBoxOnClick from "@/app/utils/emphasize-chips/emphasize-onclick/storageBoxOnClick";
import {hospitalOnClick} from "@/app/utils/emphasize-chips/emphasize-onclick/hospitalOnClick";
import {drinkingFountainOnClick} from "@/app/utils/emphasize-chips/emphasize-onclick/drinkingFountainOnClick";
import altitudeOnClick from "@/app/utils/tile-chips/title-onclick/altitudeOnClick";
import React from "react";


export default function Toc() {
    return (
        <div className={styles.topSheet}>
            {/* 강조 구역 버튼 모음 */}
            <div className={styles.emphasizeChips}>
                <Chip label={"인기 코스"}  onClickAction={popularCourseOnClick}/> {/* 인기 코스 */}
                <Chip label={"도보 경로"} onClickAction={toggleSidewalkVisible}/> {/* 횡단보도 */}
                <Chip label={"횡단보도"} onClickAction={crosswalkOnClick} inActiveOnClickAction={async ()=>clearMarkers(getCrosswalk())} /> {/* 도보 경로 */}
                <Chip label={"물품보관함"} onClickAction={storageBoxOnClick}/> {/* 물품보관함 */}
                <Chip label={"병원"} onClickAction={hospitalOnClick} inActiveOnClickAction={async ()=>clearMarkers(getHospital())}/> {/* 병원 */}
                <Chip label={"음수대"} onClickAction={drinkingFountainOnClick} inActiveOnClickAction={async ()=>clearMarkers(getDrinkingFoundation())}/> {/* 음수대 */}
            </div>
            {/* 타일 버튼 모음 */}
            <div className={styles.tileChips}>
                <Chip label="고도 표시" onClickAction={altitudeOnClick}/>
                <Chip label="재질 표시" onClickAction={async () => {}}/> {/* TODO: 재질 표시 로직 */}
                <Chip label="온도 측정" onClickAction={async () => {}}/> {/* TODO: 온도 측정 로직 */}
            </div>
        </div>
    )
}