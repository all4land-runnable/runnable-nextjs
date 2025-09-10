'use client'

import styles from "@/app/page.module.scss"
import {remToPx} from "@/app/utils/claculator/pxToRem";
import PaceStrategy from "@/app/components/molecules/pace-strategy/PaceStrategy";
import RouteRanking from "@/app/components/molecules/route-ranking/RouteRanking";
import {Chip} from "@/app/components/atom/chip/Chip";
import RouteSimulation from "@/app/components/atom/route-simulation/RouteSimulation";
import SlopeGraph from "@/app/components/molecules/slope-graph/SlopeGraph";
import {useSelector} from "react-redux";
import {RootState} from "@/app/store/redux/store";

/**
 * 오른쪽 사이드바를 구현하는 함수
 * @constructor
 */
export default function RightSideBar() {
    const open = useSelector((state: RootState) => state.rightSideBar.open);
    const slopeGraphParams = useSelector((state: RootState) => state.rightSideBar.slopeGraphParams);
    const sectionStrategies = useSelector((state: RootState)=> state.rightSideBar.sectionStrategies);
    const routeRankingParams = useSelector((state:RootState)=> state.rightSideBar.routeRankingParams);

    return (
        open && <section className={styles.rightSideBar}>
            <div className={styles.sidebarTop}> {/* 오른쪽 사이드바 상단 */}
                <SlopeGraph slopeGraphParams={slopeGraphParams}/>
                <PaceStrategy sectionStrategyParams={sectionStrategies}/> {/* 페이스 전략 카드 */}
                <RouteRanking routeRankingParam={routeRankingParams}/> {/* 경로 랭킹 */}
            </div>
            <div className={styles.sidebarBottom}> {/* 오른쪽 사이드바 하단 */}
                <div className={styles.detailInfo}>
                    <Chip label={"구간 속도"} backgroundColor={"#FCDE8C"} fontSize={remToPx(0.75)} onClickAction={() => {
                    }}/> {/* 구간 속도 */}
                    <Chip label={"페이스 분석"} backgroundColor={"#FCDE8C"} fontSize={remToPx(0.75)} onClickAction={() => {
                    }}/> {/* 페이스 분석 */}
                </div>
                <RouteSimulation/>
            </div>
        </section>
    )
}
