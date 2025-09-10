'use client';

import React from 'react';
import styles from './Chip.module.scss';
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
type ChipProps = {
    label: string;
    backgroundColor: React.CSSProperties['backgroundColor'];
    fontSize: React.CSSProperties['fontSize'];
    activable?: boolean;
    onClickAction: () => void | Promise<void>;
    inActiveOnClickAction?: ()=>void | Promise<void>;
};

/**
 * 칩 버튼을 구현하는 함수
 *
 * @param chipParam 칩 버튼 속성
 * @constructor
 */
export function Chip({label, backgroundColor, fontSize, activable = true, onClickAction, inActiveOnClickAction}: ChipProps) {
    // 활성화 상태
    const [active, setActive] = React.useState(true);

    // Chip 버튼 선택 함수
    const handleClick = async () => {
        try {
            if(inActiveOnClickAction != null && !active)
                await inActiveOnClickAction()
            else
                await onClickAction();

            if(activable) setActive(!active);
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
            style={{fontSize: fontSize, backgroundColor: active ? backgroundColor : undefined,}}
            aria-pressed={active}
            onClick={handleClick}
        > {/* 폰트 크기와 배경색은 인자 값으로 변경 가능하다. */}
            {label}
        </button>
    );
}
