'use client';

import styles from '../../page.module.css'
import React from "react";
import LeftSideBar from "@/app/components/templates/left-side-bar/LeftSideBar";
import EmphasizeChips from "@/app/components/molecules/emphasize-chips/EmphasizeChips";
import TileChips from "@/app/components/molecules/tile-chips/TileChips";
import RightSideBar from "@/app/components/templates/right-side-bar/RightSideBar";
import ListChips from "@/app/components/molecules/list-chips/ListChips";
import {SectionStrategyParam} from "@/app/components/organisms/pace-strategy/PaceStrategy";
import {RouteRankingParam} from "@/app/components/organisms/route-ranking/RouteRanking";
import {SlopeGraphParam} from "@/app/components/organisms/slope-graph/SlopeGraph";

/**
 * 홈 화면을 구현하는 함수
 * @constructor
 */
export default function Page() {
    const [openRightSideBar, setOpenRightSideBar] = React.useState(false); // 오른쪽 사이드바 확장 상태

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

    const slopeGraphParams: SlopeGraphParam[] = [
        {
            meter: 50,
            height: 10,
        },
        {
            meter: 100,
            height: 20,
        },
    ]

    return (
        <>
            <div className={styles.onViewer}>
                {/* 왼쪽 사이드 바 */}
                <LeftSideBar rightSideBarState={{openRightSideBar: openRightSideBar, setOpenRightSideBar: setOpenRightSideBar}}/>
                <div className={styles.topSheet}>
                    <EmphasizeChips/> {/* 구역 강조 버튼 모음 */}
                    <TileChips/> {/* 타일 버튼 모음 */}
                </div>
                {/* 오른쪽 사이드 바 */}
                {openRightSideBar??<RightSideBar slopeGraphParams={slopeGraphParams} sectionStrategies={sectionStrategies} routeRankingParams={routeRankingParams}/>}
            </div>

            <section className={styles.bottomSheet}>
                <ListChips/>
            </section>
        </>
    )
}
