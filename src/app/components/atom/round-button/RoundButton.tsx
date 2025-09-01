'use client';

import React from "react";
import {UnactiveError} from "@/error/unactiveError";
import styles from './RoundButton.module.css'

/**
 * 굴곡이 있는 버튼 속성
 * @param label 버튼 내용
 * @param backgroundColor 버튼 배경 색상
 * @param fontSize 버튼 텍스트 크기
 * @param toggle 버튼 토글 여부
 * @param onClick 클릭 이벤트 리스너
 */
export type RoundButtonParam = {
    label: string;
    backgroundColor: React.CSSProperties['backgroundColor'];
    fontSize: React.CSSProperties['fontSize'];
    toggle?: boolean;
    onClick: () => void | Promise<void>;
}

type RoundButtonProps = { roundButtonParam: RoundButtonParam };

/**
 * 굴곡진 버튼을 구현하는 함수
 * @param roundButtonParam 굴곡진 버튼 속성
 * @constructor
 */
export function RoundButton({ roundButtonParam }: RoundButtonProps) {
    // 활성화 상태
    const [active, setActive] = React.useState(true);

    // 토글 속성의 기본값은 true
    const toggle = roundButtonParam.toggle ?? true;

    // 클릭 리스너 할당
    const handleClick = async () => {
        // 토글 버튼인 경우, 토글 지정
        if(toggle) setActive((active) => !active);

        try {
            await roundButtonParam.onClick();
        } catch (e) { // 에러 발생 시,
            // 버튼 상태를 다시 되돌린다.
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
            className={[styles.roundButton, styles.roundButtonFont, active ? styles.roundButtonActive : styles.roundButtonInactive].join(' ')}
            style={{fontSize: roundButtonParam.fontSize}}
            aria-pressed={active}
            onClick={handleClick}
        > {/* 폰트 크기와 배경색은 인자 값으로 변경 가능하다. */}
            {roundButtonParam.label}
        </button>
    );
}
