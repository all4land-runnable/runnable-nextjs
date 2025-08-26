'use client'

import React from 'react';
import styles from './RightSideBar.module.css'
import PaceStrategy, { PacePoint } from '@/app/components/pace-strategy/PaceStrategy';
import RouteRanking from "@/app/components/route-ranking/RouteRanking";
import RouteSimulation from "@/app/components/route-simulation/RouteSimulation";
import Chip from "@/app/components/chip/Chip";

export default function RightSideBar() {

    const points: PacePoint[] = [
        {
            place: '여의도 공원 입구',
            headline: '내리막입니다.',
            paceHint: "6’10’’",
            details: ['페이스를 유지해 주세요!']
        },
        {
            place: '마포대교 사거리',
            headline: '매우 가파른 경사입니다.',
            paceHint: "7’20’’",
            details: ['주변에 음수대가 있습니다.', '수분을 보충할 수 있습니다.']
        },
        // 필요만큼 계속 추가...
    ];

    return <section className={`${styles.rightSideBar} col-top padding-050rem space-between collapse-width event`}>
        <div className="col-top">
            <PaceStrategy points={points} maxHeight="62vh" />
            <RouteRanking />
        </div>
        <div className="col-bottom">
            <div className="row-start center">
                <Chip label="경사도 그래프" backgroundColor="#FCDE8C"/>
                <Chip label="구간 속도" backgroundColor="#FCDE8C"/>
                <Chip label="페이스 그래프" backgroundColor="#FCDE8C"/>
            </div>
            <RouteSimulation/>
        </div>
    </section>
}