'use client'

import React from 'react';
import styles from './RightSideBar.module.css'
import PaceStrategy, { SectionStrategy } from '@/app/components/pace-strategy/PaceStrategy';
import RouteRanking, {UserRank} from "@/app/components/route-ranking/RouteRanking";
import RouteSimulation from "@/app/components/route-simulation/RouteSimulation";
import Chip, {ChipData} from "@/app/components/chip/Chip";
import { remToPx } from "@/app/utils/pxToRem";

export type RightSideBarState = {
    open: boolean;
    setOpenRightSideBar: (open: boolean) => void;
}

type RightSideBarProps = {
    rightSideBarState: RightSideBarState;
};

export default function RightSideBar({rightSideBarState}:RightSideBarProps) {
    const sectionStrategies: SectionStrategy[] = [
        { startPlace: '여의도 공원 입구', strategies: ['페이스를 유지해 주세요!'] },
        { startPlace: '마포대교 사거리', strategies: ["매우 가파른 경사입니다. 7'20'페이스를 유지하세요!","주변에 음수대가 있습니다. 수분을 보충할 수 있습니다."] },
    ];

    const userRanking: UserRank[] = [
        { name: '김명민', rank: 1, pace: 21800 },
        { name: '김명준', rank: 2, pace: 22800 }
    ]

    const slopeGraph: ChipData = {label:"경사도 그래프", backgroundColor:"#FCDE8C", fontSize:remToPx(0.75), onClick:()=>{}};
    const sectionSpeed: ChipData = {label:"구간 속도", backgroundColor:"#FCDE8C", fontSize:remToPx(0.75), onClick:()=>{}};
    const paceAnalyze: ChipData = {label:"페이스 분석", backgroundColor:"#FCDE8C", fontSize:remToPx(0.75), onClick:()=>{}};

    const handleClick = () => {
        rightSideBarState.setOpenRightSideBar(!open);
    };

    return <section className={styles.rightSideBar} style={{ display: rightSideBarState.open ? "flex" : "none" }}>
        <span className={styles.closeBtn} onClick={handleClick}>x</span>
        <div className={styles.sidebarTop}>
            <PaceStrategy sectionStrategies={sectionStrategies}/>
            <RouteRanking userRanking={userRanking} />
        </div>
        <div className={styles.sidebarBottom}>
            <div className={styles.detailInfo}>
                <Chip chipData={slopeGraph}/>
                <Chip chipData={sectionSpeed}/>
                <Chip chipData={paceAnalyze}/>
            </div>
            <RouteSimulation/>
        </div>
    </section>
}