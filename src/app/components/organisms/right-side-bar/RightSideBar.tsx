'use client'

import styles from './RightSideBar.module.css'
import {remToPx} from "@/app/utils/claculator/pxToRem";
import PaceStrategy, {SectionStrategyParam} from "@/app/components/molecules/pace-strategy/PaceStrategy";
import RouteRanking, {RouteRankingParam} from "@/app/components/molecules/route-ranking/RouteRanking";
import {Chip} from "@/app/components/atom/chip/Chip";
import RouteSimulation from "@/app/components/atom/route-simulation/RouteSimulation";
import SlopeGraph, {SlopeGraphParam} from "@/app/components/molecules/slope-graph/SlopeGraph";

type RightSideBarProps = {
    slopeGraphParams: SlopeGraphParam[],
    sectionStrategies: SectionStrategyParam[],
    routeRankingParams: RouteRankingParam[]
}

/**
 * 오른쪽 사이드바를 구현하는 함수
 * @constructor
 */
export default function RightSideBar({slopeGraphParams, sectionStrategies, routeRankingParams}: RightSideBarProps) {
    return (
        // openRightSideBar가 true일 때만 나타난다.
        <section className={styles.rightSideBar}>
            <div className={styles.sidebarTop}> {/* 오른쪽 사이드바 상단 */}
                <SlopeGraph slopeGraphParams={slopeGraphParams}/>
                <PaceStrategy sectionStrategyParams={sectionStrategies}/> {/* 페이스 전략 카드 */}
                <RouteRanking routeRankingParam={routeRankingParams} /> {/* 경로 랭킹 */}
            </div>
            <div className={styles.sidebarBottom}> {/* 오른쪽 사이드바 하단 */}
                <div className={styles.detailInfo}>
                    <Chip label={"구간 속도"} backgroundColor={"#FCDE8C"} fontSize={remToPx(0.75)} onClickAction={()=>{}}/> {/* 구간 속도 */}
                    <Chip label={"페이스 분석"} backgroundColor={"#FCDE8C"} fontSize={remToPx(0.75)} onClickAction={()=>{}}/> {/* 페이스 분석 */}
                </div>
                <RouteSimulation/>
            </div>
        </section>
    )
}
