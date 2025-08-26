'use client';

import styles from './RouteRanking.module.css';

type Props = {
    title?: string;            // 섹션 제목 (기본: '랭킹')
    placeholder?: string;      // 가운데 문구 (기본: '업데이트 예정')
    align?: 'left' | 'center'; // 제목 정렬 (기본: 'center')
};

export default function RouteRanking({
                                           title = '랭킹',
                                           placeholder = '업데이트 예정',
                                           align = 'center',
                                       }: Props) {
    return (
        <section className={styles.wrapper}>
            <header className={`${styles.header} ${align === 'left' ? styles.left : styles.center}`}>
                <h3 className={styles.title}>{title}</h3>
                <hr className={styles.rule} />
            </header>

            <div className={styles.body}>
                <p className={styles.placeholder}>{placeholder}</p>
            </div>
        </section>
    );
}
