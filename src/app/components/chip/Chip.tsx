'use client';

import React from 'react';
import styles from './Chip.module.css';

/**
 * Chip을 생성하기 위한 인자
 */
type ChipProps = {
    label?: string;
    backgroundColor?: React.CSSProperties['backgroundColor'];
    onClick?: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * 캡슐형 버튼을 구현하는 함수
 *
 * @param label 버튼에 들어갈 글자
 * @param backgroundColor 버튼의 배경 색
 * @param onClick 클릭 시 발생할 동작
 * @constructor
 */
export default function Chip({label, backgroundColor, onClick}: ChipProps) {
    return (
        <button
            type="button"
            className={[styles.chip, styles.chipFont].filter(Boolean).join(' ')}
            style={{backgroundColor}}
            onClick={onClick}
        >
            {/* type="button"은 submit이 아님을 명시한다. */}
            {label}
        </button>
    );
}
