'use client';

import styles from './PaceStrategy.module.css';
import {formatKm} from "@/app/utils/claculator/formatKm";
import {Route, Section} from "@/type/route";
import {CardContent, Typography} from "@mui/material";
import React from "react";

/**
 * 구간 전략의 집합은 페이스 전략을 의미한다.
 */
type PaceStrategyProps = {
    route: Route
};

/**
 * 페이스 전략 카드를 구현하는 함수
 *
 * @param sectionStrategies 구간 전략들 속성
 * @constructor
 */
export default function PaceStrategy({route}: PaceStrategyProps) {
    return (
        <section className={styles.sectionStrategyCard}>
            <span className={styles.titleFont}>페이스 전략</span> {/* 카드 이름 */}
            <hr className={styles.splitter} /> {/* 이름 리스트 영역 구분선 */}

            <div className={styles.sectionList}> {/* 구간 전략 영역 */}
                {/* 각 전략 선회 */}
                {route.sections.map(
                    (section, index) => StrategyCard(index, section)
                )}
            </div>
        </section>
    );
}

function StrategyCard(index:number, section: Section) {
    const startPoint = section.points[0]
    return (
        <CardContent key={`strategy_card_${index}`}>
            <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
                {formatKm(section.distance)}
            </Typography>
            <Typography variant="h6" component="div">
                {section.startPlace}
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>
                위도: {startPoint.latitude.toFixed(2)} 경도: {startPoint.longitude.toFixed(2)} 높이: {startPoint.height.toFixed(2)}
            </Typography>
            {section.strategies.map((strategy, strategy_index) => (
                <Typography key={`strategy-${strategy_index}`} variant="body2">
                - {strategy}
                </Typography>
            ))}
        </CardContent>
    )
}