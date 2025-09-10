'use client';

import styles from './page.module.css'
import React, {useEffect, useState} from "react";
import {SectionStrategyParam} from "@/app/components/molecules/pace-strategy/PaceStrategy";
import {RouteRankingParam} from "@/app/components/molecules/route-ranking/RouteRanking";
import type {SlopeGraphParam} from "@/app/components/molecules/slope-graph/SlopeGraph";
import {getPedestrianRoute, getTempRoute} from "@/app/staticVariables";
import SaveChips from "@/app/utils/save-chips/SaveChips";
import {useDispatch} from "react-redux";
import {openWithData} from "@/app/store/redux/feature/rightSidebarSlice";
import {buildRouteFromEntity} from "@/app/utils/buildRouteFromEntity";

/**
 * 홈 화면을 구현하는 함수
 * @constructor
 */
export default function Page() {
    const dispatch = useDispatch()
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
    const [tempSlopeParams, setTempSlopeParams] = useState<SlopeGraphParam[]>([]); // TODO: 제거할 것
    const [pedestrianSlopeParams, setPedestrianSlopeParams] = useState<SlopeGraphParam[]>([]); // TODO: 제거할 것

    // NOTE 1. 처음 화면 생성 시 작동
    useEffect(()=>{
        const pedestrianRoute = getPedestrianRoute()
        buildRouteFromEntity(pedestrianRoute).then((route)=>{
            const params: SlopeGraphParam[] = []
            route.sections.forEach((section)=>{
                section.points.forEach((point)=>{
                    params.push({
                        meter: point.distance,
                        height: point.height,
                    })
                })
            })
            setPedestrianSlopeParams(params); // TODO: 수정할 것
        }).catch(console.error);


        const tempRoute = getTempRoute()
        buildRouteFromEntity(tempRoute).then((route) => {
            const params: SlopeGraphParam[] = []
            route.sections.forEach((section)=>{
                section.points.forEach((point)=>{
                    params.push({
                        meter: point.distance,
                        height: point.height,
                    })
                })
            })
            setTempSlopeParams(params); // TODO: 수정할 것
        }).catch(console.error);
    }, [pedestrianSlopeParams])

    useEffect(()=>{
        dispatch(openWithData({
            slopeGraphParams:onAutomaticRoute?tempSlopeParams:pedestrianSlopeParams,
            sectionStrategies:sectionStrategies,
            routeRankingParams:routeRankingParams
        }))
    },[dispatch, onAutomaticRoute, pedestrianSlopeParams, routeRankingParams, sectionStrategies, tempSlopeParams])

    // 오른쪽 사이드바 확장 상태
    return (
        <>
            <section className={styles.bottomSheet}>
                <SaveChips automaticRouteState={{onAutomaticRoute, setOnAutomaticRoute}}/>
            </section>
        </>
    )
}