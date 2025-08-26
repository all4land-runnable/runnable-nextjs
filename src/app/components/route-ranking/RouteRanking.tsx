'use client';

import styles from './RouteRanking.module.css';

export type UserRank = {
    name: string;
    rank: number;
    pace: number;
}

type Props = {
    userRanking: UserRank[];
};

export default function RouteRanking({userRanking}: Props) {
    return (
        <section className={styles.routeRankingCard}>
            {/* 카드 이름 */}
            <span className={styles.titleFont}>랭크</span>
            {/* 이름 리스트 영역 구분선 */}
            <hr className={styles.splitter} />

            <div className={[styles.body, styles.bodyFont].join(' ')}>
                <span>업데이트 예정</span>
                <span>(예시)</span>
                {userRanking.map((userRank, index) => (
                    <span key={`${3}_${index}`}>{userRank.rank}등 {userRank.name} {userRank.pace}</span>
                ))}
            </div>
        </section>
    );
}
