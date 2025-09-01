'use client'

import React from 'react';
import styles from './RightSideBar.module.css'
import {remToPx} from "@/app/utils/claculator/pxToRem";
import PaceStrategy, {SectionStrategyParam} from "@/app/components/organisms/pace-strategy/PaceStrategy";
import RouteRanking, {RouteRankingParam} from "@/app/components/organisms/route-ranking/RouteRanking";
import {Chip, ChipParam} from "@/app/components/atom/chip/Chip";
import RouteSimulation from "@/app/components/atom/route-simulation/RouteSimulation";

/**
 * 오른쪽 사이드바 확장 상태
 *
 * @param openRightSideBar 오른쪽 사이드바 현재 확장 상태
 * @param setOpenRightSideBar 오른쪽 사이드바 확장 상태 변경
 */
export type RightSideBarState = {
    openRightSideBar: boolean;
    setOpenRightSideBar: (open: boolean) => void;
}

type RightSideBarProps = {
    rightSideBarState: RightSideBarState;
};

/**
 * 오른쪽 사이드바를 구현하는 함수
 *
 * @param rightSideBarState 오른쪽 사이드바 확장 상태
 * @constructor
 */
export default function RightSideBar({rightSideBarState}:RightSideBarProps) {
    // NOTE: 샘플 구간 전략 속성
    const sectionStrategies: SectionStrategyParam[] = [
        { startPlace: '여의도 공원 입구', strategies: ['페이스를 유지해 주세요!'] },
        { startPlace: '마포대교 사거리', strategies: ["매우 가파른 경사입니다. 7'20'페이스를 유지하세요!","주변에 음수대가 있습니다. 수분을 보충할 수 있습니다."] },
    ];

    // NOTE: 샘플 경로 랭킹 속성
    const routeRankingParam: RouteRankingParam[] = [
        { name: '김명민', rank: 1, pace: 21800 },
        { name: '김명준', rank: 2, pace: 22800 }
    ]

    // chip 버튼 속성 선언
    const slopeGraph: ChipParam = {label:"경사도 그래프", backgroundColor:"#FCDE8C", fontSize:remToPx(0.75), onClick:()=>{}};
    const sectionSpeed: ChipParam = {label:"구간 속도", backgroundColor:"#FCDE8C", fontSize:remToPx(0.75), onClick:()=>{}};
    const paceAnalyze: ChipParam = {label:"페이스 분석", backgroundColor:"#FCDE8C", fontSize:remToPx(0.75), onClick:()=>{}};

    // 닫기 버튼 선택 함수
    const rightSideBarCloseHandler = () => rightSideBarState.setOpenRightSideBar(!open);

    return (
        // openRightSideBar가 true일 때만 나타난다.
        <section className={styles.rightSideBar} style={{ display: rightSideBarState.openRightSideBar ? "flex" : "none" }}>
            <span className={styles.closeBtn} onClick={rightSideBarCloseHandler}>×</span> {/* 닫기 버튼 */}
            <div className={styles.sidebarTop}> {/* 오른쪽 사이드바 상단 */}
                <PaceStrategy sectionStrategyParams={sectionStrategies}/> {/* 페이스 전략 카드 */}
                <RouteRanking routeRankingParam={routeRankingParam} /> {/* 경로 랭킹 */}
            </div>
            <div className={styles.sidebarBottom}> {/* 오른쪽 사이드바 하단 */}
                <div className={styles.detailInfo}>
                    <Chip chipParam={slopeGraph}/> {/* 경사도 그래프 */}
                    <Chip chipParam={sectionSpeed}/> {/* 구간 속도 */}
                    <Chip chipParam={paceAnalyze}/> {/* 페이스 분석 */}
                </div>
                <RouteSimulation/>
            </div>
        </section>
    )
}