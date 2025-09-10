'use client';

import React from "react";
import styles from './page.module.scss'
import {Chip} from "@/app/components/atom/chip/Chip";
import {remToPx} from "@/app/utils/claculator/pxToRem";
import clearMarkers from "@/app/utils/markers/clearMarkers";
import {getCrosswalk, getDrinkingFoundation, getHospital} from "@/app/staticVariables";
import {useRouter} from "next/navigation";
import popularCourseOnClick from "@/app/utils/emphasize-chips/emphasize-onclick/popularCourseOnClick";
import {toggleSidewalkVisible} from "@/app/utils/emphasize-chips/emphasize-onclick/sidewalkOnClick";
import {crosswalkOnClick} from "@/app/utils/emphasize-chips/emphasize-onclick/crosswalkOnClick";
import storageBoxOnClick from "./utils/emphasize-chips/emphasize-onclick/storageBoxOnClick";
import {hospitalOnClick} from "@/app/utils/emphasize-chips/emphasize-onclick/hospitalOnClick";
import { drinkingFountainOnClick } from "./utils/emphasize-chips/emphasize-onclick/drinkingFountainOnClick";
import altitudeOnClick from "@/app/utils/tile-chips/title-onclick/altitudeOnClick";

/**
 * 홈 화면을 구현하는 함수
 * @constructor
 */
export default function Page() {
    const router = useRouter();

    return (
        <>
            <div className={styles.onViewer}>
                <div className={styles.topSheet}>
                    {/* 강조 구역 버튼 모음 */}
                    <div className={styles.emphasizeChips}>
                        <Chip label={"인기 코스"} backgroundColor={"#A1F0CB"} fontSize={remToPx(1.125)} onClickAction={popularCourseOnClick}/> {/* 인기 코스 */}
                        <Chip label={"도보 경로"} backgroundColor={"#A1F0CB"} fontSize={remToPx(1.125)} onClickAction={toggleSidewalkVisible}/> {/* 횡단보도 */}
                        <Chip label={"횡단보도"} backgroundColor={"#A1F0CB"} fontSize={remToPx(1.125)} onClickAction={crosswalkOnClick} inActiveOnClickAction={async ()=>clearMarkers(getCrosswalk())} /> {/* 도보 경로 */}
                        <Chip label={"물품보관함"} backgroundColor={"#A1F0CB"} fontSize={remToPx(1.125)} onClickAction={storageBoxOnClick}/> {/* 물품보관함 */}
                        <Chip label={"병원"} backgroundColor={"#A1F0CB"} fontSize={remToPx(1.125)} onClickAction={hospitalOnClick} inActiveOnClickAction={async ()=>clearMarkers(getHospital())}/> {/* 병원 */}
                        <Chip label={"음수대"} backgroundColor={"#A1F0CB"} fontSize={remToPx(1.125)} onClickAction={drinkingFountainOnClick} inActiveOnClickAction={async ()=>clearMarkers(getDrinkingFoundation())}/> {/* 음수대 */}
                    </div>
                    {/* 타일 버튼 모음 */}
                    <div className={styles.tileChips}>
                        <Chip label="고도 표시" backgroundColor="#FCDE8C" fontSize={remToPx(1.125)} onClickAction={altitudeOnClick}/>
                        <Chip label="재질 표시" backgroundColor="#FCDE8C" fontSize={remToPx(1.125)} onClickAction={async () => {}}/> {/* TODO: 재질 표시 로직 */}
                        <Chip label="온도 측정" backgroundColor="#FCDE8C" fontSize={remToPx(1.125)} onClickAction={async () => {}}/> {/* TODO: 온도 측정 로직 */}
                    </div>
                </div>
            </div>

            <section className={styles.bottomSheet}>
                {/* 경로 관련 버튼 모음 */}
                <div className={styles.routeChips}>
                    <Chip label={"경로 생성"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} activable={false} onClickAction={() => { router.push("/pages/route-drawing"); }}/>
                    <Chip label={"경로 목록"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} activable={false} onClickAction={() => { router.push("/pages/route-list"); }}/>
                </div>
            </section>
        </>
    )
}
