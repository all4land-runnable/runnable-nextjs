'use client';

import styles from './PaceStrategy.module.css';
import {formatKm} from "@/app/utils/claculator/formatKm";

/**
 * 구간 전략 속성
 *
 * @param startPlace 구간 시작점
 * @param strategies 구간 내 전략들
 */
export type SectionStrategyParam = {
    distance:number;
    startPlace: string;
    strategies: string[];
};

/**
 * 구간 전략의 집합은 페이스 전략을 의미한다.
 */
type PaceStrategyProps = {
    sectionStrategyParams: SectionStrategyParam[];
};

/**
 * 페이스 전략 카드를 구현하는 함수
 *
 * @param sectionStrategies 구간 전략들 속성
 * @constructor
 */
export default function PaceStrategy({sectionStrategyParams}: PaceStrategyProps) {
    return (
        <section className={styles.sectionStrategyCard}>
            {/* 카드 이름 */}
            <span className={styles.titleFont}>페이스 전략</span>
            {/* 이름 리스트 영역 구분선 */}
            <hr className={styles.splitter} />

            {/* 구간 전략 영역 */}
            <div className={styles.sectionList}>
                {/* 각 전략 선회 */}
                {sectionStrategyParams.map((sectionStrategy, index) => (
                    <div className={styles.sectionStrategy} key={`$section-strategy_${index}`}>
                        <div className={styles.marker}> {/* 세로 선 구현 */}
                            <span className={styles.dot} /> {/* TODO: 점 그리기 오류 있음 */}
                            {/* 세로 라인은 CSS ::after 로 처리 */}
                        </div>

                        <div className={styles.section}> {/* 각 전략 선회 */}
                            <span className={styles.startPlaceFont}> {/* 출발 지점 이름 */}
                                {formatKm(sectionStrategy.distance)} : {sectionStrategy.startPlace}
                            </span>
                            <div className={styles.strategies}> {/* 각 구간 별 전략들 선회 */}
                                {sectionStrategy.strategies.map((strategy, index) => (
                                    <span className={[styles.strategy, styles.strategyFont].join(' ')} key={`strategy-${index}`}>- {strategy}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
