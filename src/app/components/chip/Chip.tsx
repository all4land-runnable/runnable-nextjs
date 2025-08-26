'use client';

import React from 'react';
import styles from './Chip.module.css';

/**
 * 구간 별 전략 리스트를 구현하는 함수
 *
 * @param sectionStrategies 구간 별 맞춤 전략
 * @constructor
 */
export type ChipData = {
    label: string;
    backgroundColor: React.CSSProperties['backgroundColor'];
    fontSize: React.CSSProperties['fontSize'];
    onClick: () => void;
}

type ChipProps = {
    chipData: ChipData;
};

export default function Chip({chipData}: ChipProps) {
    const [active, setActive] = React.useState(true);

    const handleClick = () => {
        setActive((prev) => !prev);

        chipData.onClick();
    };

    return (
        <button
            type="button"
            className={[styles.chip, styles.chipFont, active ? styles.chipActive : styles.chipInactive].join(' ')}
            style={{fontSize: chipData.fontSize, backgroundColor: active ? chipData.backgroundColor : undefined,}}
            aria-pressed={active}
            onClick={handleClick}
        > {/* 폰트 크기와 배경색은 인자 값으로 변경 가능하다. */}
            {chipData.label}
        </button>
    );
}
