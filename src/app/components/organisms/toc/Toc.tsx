'use client';

import styles from "./Toc.module.css";
import {ChipButton} from "@/app/components/atom/chip/ChipButton";
import popularCourseOnClick from "@/app/utils/emphasize-chips/emphasize-onclick/popularCourseOnClick";
import {toggleSidewalkVisible} from "@/app/utils/emphasize-chips/emphasize-onclick/sidewalkOnClick";
import {crosswalkOnClick} from "@/app/utils/emphasize-chips/emphasize-onclick/crosswalkOnClick";
import clearMarkers from "@/app/utils/markers/clearMarkers";
import {getCrosswalk, getDrinkingFoundation, getHospital} from "@/app/staticVariables";
import storageBoxOnClick from "@/app/utils/emphasize-chips/emphasize-onclick/storageBoxOnClick";
import {hospitalOnClick} from "@/app/utils/emphasize-chips/emphasize-onclick/hospitalOnClick";
import {drinkingFountainOnClick} from "@/app/utils/emphasize-chips/emphasize-onclick/drinkingFountainOnClick";
import React, {useState} from "react";
import temperatureOnClick, {removeTemperature} from "@/app/utils/tile-chips/temperature-onclick/temperatureOnClick";
import {setLayer} from "@/app/utils/tile-chips/setVWorldTile";


export default function Toc() {
    const [vworldOpen, setVworldOpen] = useState<boolean>(false);
    const [onTemperature, setOnTemperature] = useState<boolean>(false);

    const vworldOpenHandler = () => {
        setVworldOpen(!vworldOpen);
        setLayer("vworld", vworldOpen);
    }

    const onTemperatureHandler = () => {
        setOnTemperature(!onTemperature);
        if(onTemperature) {
            removeTemperature()
        } else {
            temperatureOnClick().then()
        }
    }

    return (
        <div className={styles.topSheet}>
            {/* 강조 구역 버튼 모음 */}
            <div className={styles.emphasizeChips}>
                <ChipButton label={"인기 코스"} selectAction={popularCourseOnClick}/> {/* 인기 코스 */}
                <ChipButton label={"도보 경로"} selectAction={toggleSidewalkVisible}/> {/* 횡단보도 */}
                <ChipButton label={"횡단보도"} selectAction={crosswalkOnClick} unSelectAction={async ()=>clearMarkers(getCrosswalk())} /> {/* 도보 경로 */}
                <ChipButton label={"물품보관함"} selectAction={storageBoxOnClick}/> {/* 물품보관함 */}
                <ChipButton label={"병원"} selectAction={hospitalOnClick} unSelectAction={async ()=>clearMarkers(getHospital())}/> {/* 병원 */}
                <ChipButton label={"음수대"} selectAction={drinkingFountainOnClick} unSelectAction={async ()=>clearMarkers(getDrinkingFoundation())}/> {/* 음수대 */}
            </div>
            {/* 타일 버튼 모음 */}
            <div className={styles.tileChips}>
                <ChipButton label={"브이월드"} selectAction={()=>vworldOpenHandler()}/>
                {/*<ChipButton label="재질 표시" onClickAction={async () => {}}/> /!* TODO: 재질 표시 로직 *!/*/}
                <ChipButton label="온도 측정" selectAction={onTemperatureHandler}/> {/* TODO: 온도 측정 로직 */}
            </div>
        </div>
    )
}