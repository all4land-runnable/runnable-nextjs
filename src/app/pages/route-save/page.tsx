'use client';

import styles from './page.module.css'
import React, {useEffect, useRef, useState} from "react";
import RightSideBar from "@/app/components/templates/right-side-bar/RightSideBar";
import SaveChips from "@/app/components/molecules/save-chips/SaveChips";
import {SectionStrategyParam} from "@/app/components/organisms/pace-strategy/PaceStrategy";
import {RouteRankingParam} from "@/app/components/organisms/route-ranking/RouteRanking";
import {routeHeightFromEntity} from "@/app/utils/routeHeight";
import type {SlopeGraphParam} from "@/app/components/organisms/slope-graph/SlopeGraph";
import * as Cesium from "cesium";
import getViewer from "@/app/components/templates/cesium/util/getViewer";
import {getPedestrianRoute, getTempRoute} from "@/app/staticVariables";

/**
 * 홈 화면을 구현하는 함수
 * @constructor
 */
export default function Page() {
    const [onAutomaticRoute, setOnAutomaticRoute] = React.useState<boolean>(false);

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

    // 그래프 데이터 상태
    const [tempSlopeParams, setTempSlopeParams] = useState<SlopeGraphParam[]>([]);
    const [pedestrianSlopeParams, setPedestrianSlopeParams] = useState<SlopeGraphParam[]>([]);

    // NOTE 1. 처음 화면 생성 시 작동
    const initializedRef = useRef(false);
    useEffect(()=>{
        if (initializedRef.current) return;
        initializedRef.current = true;

        const viewer = getViewer();

        const pedestrianRoute = getPedestrianRoute()
        routeHeightFromEntity(viewer, pedestrianRoute).then((heights)=>{
            const params: SlopeGraphParam[] = heights.map((heightSample) => ({
                meter: heightSample.dist,
                height: heightSample.height, // ← 숫자 필드만 사용
            }));
            setPedestrianSlopeParams(params);
        }).catch(console.error);


        const tempRoute = getTempRoute()
        routeHeightFromEntity(viewer, tempRoute).then((heights) => {
            const params: SlopeGraphParam[] = heights.map((heightSample) => ({
                meter: heightSample.dist,
                height: heightSample.height, // ← 숫자 필드만 사용
            }));
            setTempSlopeParams(params);
        }).catch(console.error);
    }, [])

    // 오른쪽 사이드바 확장 상태
    return (
        <>
            <div className={styles.onViewer}>
                {/* 오른쪽 사이드 바 */}
                <RightSideBar slopeGraphParams={onAutomaticRoute?tempSlopeParams:pedestrianSlopeParams} sectionStrategies={sectionStrategies} routeRankingParams={routeRankingParams} />
            </div>

            <section className={styles.bottomSheet}>
                <SaveChips automaticRouteState={{onAutomaticRoute, setOnAutomaticRoute}}/>
            </section>
        </>
    )
}
