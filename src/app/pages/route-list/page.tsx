'use client';

import styles from '../../page.module.scss'
import React from "react";
import {SectionStrategyParam} from "@/app/components/molecules/pace-strategy/PaceStrategy";
import {RouteRankingParam} from "@/app/components/molecules/route-ranking/RouteRanking";
import {Chip} from "@/app/components/atom/chip/Chip";
import {remToPx} from "@/app/utils/claculator/pxToRem";
import {getCrosswalk, getDrinkingFoundation, getHospital} from "@/app/staticVariables";
import clearMarkers from "@/app/utils/markers/clearMarkers";
import {useRouter} from "next/navigation";
import popularCourseOnClick from "@/app/utils/emphasize-chips/emphasize-onclick/popularCourseOnClick";
import {toggleSidewalkVisible} from "@/app/utils/emphasize-chips/emphasize-onclick/sidewalkOnClick";
import altitudeOnClick from "@/app/utils/tile-chips/title-onclick/altitudeOnClick";
import storageBoxOnClick from "@/app/utils/emphasize-chips/emphasize-onclick/storageBoxOnClick";
import {drinkingFountainOnClick} from "@/app/utils/emphasize-chips/emphasize-onclick/drinkingFountainOnClick";
import { crosswalkOnClick } from "@/app/utils/emphasize-chips/emphasize-onclick/crosswalkOnClick";
import {hospitalOnClick} from "@/app/utils/emphasize-chips/emphasize-onclick/hospitalOnClick";

/**
 * 홈 화면을 구현하는 함수
 * @constructor
 */
export default function Page() {
    const router = useRouter();

    // NOTE: 샘플 구간 전략 속성
    const sectionStrategies: SectionStrategyParam[] = [
        { startPlace: '여의도 공원 입구', strategies: ['페이스를 유지해 주세요!'] },
        { startPlace: '마포대교 사거리', strategies: ["매우 가파른 경사입니다. 7'20'페이스를 유지하세요!","주변에 음수대가 있습니다. 수분을 보충할 수 있습니다."] },
    ];

    // NOTE: 샘플 경로 랭킹 속성
    const routeRankingParams: RouteRankingParam[] = [
        { name: '김명민', rank: 1, pace: 21800 },
        { name: '김명준', rank: 2, pace: 22800 }
    ]

    const slopeGraphParams = []

    return (
        <>
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

            <section className={styles.bottomSheet}>
                <div className={styles.listChips}>
                    <Chip label={"홈"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} activable={false} onClickAction={()=> { router.push('/') }}/> {/* 뒤로가기 */}
                </div>
            </section>
        </>
    )
}
