'use client';

import styles from './PaceStrategy.module.css';

/**
 * 각 구간 별 전송받을 데이터
 * @param startPlace 구간 시작점
 * @param strategies
 */
export type SectionStrategy = {
    startPlace: string;
    strategies: string[];
};

/**
 * PaceStrategy를 생성하기 위한 인자
 */
type PaceStrategyProps = {
    sectionStrategies: SectionStrategy[];
};

/**
 * 구간 별 전략 리스트를 구현하는 함수
 *
 * @param sectionStrategies 구간 별 맞춤 전략
 * @constructor
 */
export default function PaceStrategy({sectionStrategies}: PaceStrategyProps) {
    return (
        <section className={styles.sectionStrategyCard}>
            {/* 카드 이름 */}
            <span className={styles.titleFont}>페이스 전략</span>
            {/* 이름 리스트 영역 구분선 */}
            <hr className={styles.splitter} />

            {/* 구간 전략 영역 */}
            <div className={styles.sectionList}>
                {/* 각 전략 선회 */}
                {sectionStrategies.map((sectionStrategy, index) => (
                    <div className={styles.sectionStrategy} key={`${1}_${index}`}> {/* TODO: key 이름 변경할 것 */}
                        <div className={styles.marker}> {/* 세로 선 구현 */}
                            <span className={styles.dot} /> {/* TODO: 점 그리기 오류 있음 */}
                            {/* 세로 라인은 CSS ::after 로 처리 */}
                        </div>

                        <div className={styles.section}> {/* 각 전략 선회 */}
                            <span className={styles.startPlaceFont}> {/* 출발 지점 이름 */}
                                {sectionStrategy.startPlace}
                            </span>
                            <div className={styles.strategies}> {/* 각 구간 별 전략들 선회 */}
                                {sectionStrategy.strategies.map((strategy, index) => (
                                    /* TODO: key 이름 변경할 것 */
                                    <span className={[styles.strategy, styles.strategyFont].join(' ')} key={`${2}_${index}`}>{strategy}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
