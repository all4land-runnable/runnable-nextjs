'use client';

import React from 'react';
import styles from './Chip.module.css';
import {UnactiveError} from "@/error/unactiveError";

/**
 * 칩 버튼 속성
 *
 * @param label 텍스트
 * @param backgroundColor 배경색
 * @param fontSize 폰트 크기
 * @param onClick 선택 시 수행될 동작
 * @constructor
 */
export type ChipParam = {
    label: string;
    backgroundColor: React.CSSProperties['backgroundColor'];
    fontSize: React.CSSProperties['fontSize'];
    onClick: () => void;
}

type ChipProps = {
    chipParam: ChipParam;
};

export function Chip({chipParam}: ChipProps) {
    // 활성화 상태
    const [active, setActive] = React.useState(true);

    // Chip 버튼 선택 함수
    const handleClick = async () => {
        setActive((active) => !active);

        try {
            await chipParam.onClick();
        } catch (e) {
            if (e instanceof UnactiveError && e.code === -101) {
                setActive(true);
                return;
            }
            console.error(e);
            setActive(true);
        }
    };

    return (
        <button
            type="button"
            className={[styles.chip, styles.chipFont, active ? styles.chipActive : styles.chipInactive].join(' ')}
            style={{fontSize: chipParam.fontSize, backgroundColor: active ? chipParam.backgroundColor : undefined,}}
            aria-pressed={active}
            onClick={handleClick}
        > {/* 폰트 크기와 배경색은 인자 값으로 변경 가능하다. */}
            {chipParam.label}
        </button>
    );
}
