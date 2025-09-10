'use client';

import styles from './RouteRanking.module.css';

/**
 * 경로 랭킹 속성
 *
 * @param name 사용자 이름
 * @param rank 순위
 * @param pace 평균 페이스
 */
export type RouteRankingParam = {
    name: string;
    rank: number;
    pace: number;
}

type RouteRankingProps = {
    routeRankingParam: RouteRankingParam[];
};

/**
 * 경로 내 랭킹을 구현하는 함수
 *
 * @param routeRankingParam 경로 랭킹 속성
 * @constructor
 */
export default function RouteRanking({routeRankingParam}: RouteRankingProps) {
    return (
        <section className={styles.routeRankingCard}>
            {/* 카드 이름 */}
            <span className={styles.titleFont}>랭크</span>
            {/* 이름 리스트 영역 구분선 */}
            <hr className={styles.splitter} />

            <div className={[styles.body, styles.bodyFont].join(' ')}>
                <span>업데이트 예정</span> {/* TODO: 업데이트 예정 */}
                <span>(예시)</span>
                {routeRankingParam.map((userRank, index) => (
                    <span key={`user-rank_${index}`}>{userRank.rank}등 {userRank.name} {userRank.pace}</span>
                ))}
            </div>
        </section>
    );
}
