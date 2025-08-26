'use client';

import styles from './PaceStrategy.module.css';

export type PacePoint = {
    /** 장소(큰 제목) */
    place: string;
    /** 한 줄 요약 또는 강조 문장 */
    headline?: string;
    /** 상세 설명(여러 줄 가능) */
    details?: string[];
    /** 선택: 페이스 표기(예: 6’10’’) */
    paceHint?: string;
};

type Props = {
    /** 타이틀(상단) */
    title?: string;
    /** 표시할 지점들(많아도 됨) */
    points: PacePoint[];
    /** 최대 높이(뷰포트에 맞게 스크롤) */
    maxHeight?: string; // e.g. "60vh"
};

export default function PaceStrategy({
                                         title = '페이스 전략',
                                         points,
                                         maxHeight = '70vh',
                                     }: Props) {
    return (
        <section className={styles.wrapper} style={{ maxHeight }}>
            <header className={styles.header}>
                <h2 className={styles.heading}>{title}</h2>
                <hr className={styles.rule} />
            </header>

            <ol className={styles.timeline}>
                {points.map((p, idx) => (
                    <li className={styles.item} key={`${p.place}_${idx}`}>
                        <div className={styles.marker}>
                            <span className={styles.dot} />
                            {/* 세로 라인은 CSS ::after 로 처리 */}
                        </div>

                        <div className={styles.content}>
                            <h3 className={styles.place}>{p.place}</h3>

                            {(p.headline || p.paceHint) && (
                                <p className={styles.headline}>
                                    {p.headline}
                                    {p.headline && p.paceHint ? ' ' : ''}
                                    {p.paceHint ? (
                                        <strong className={styles.pace}> {p.paceHint} 페이스</strong>
                                    ) : null}
                                </p>
                            )}

                            {p.details && p.details.length > 0 && (
                                <ul className={styles.details}>
                                    {p.details.map((d, i) => (
                                        <li key={i}>{d}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </li>
                ))}
            </ol>
        </section>
    );
}
