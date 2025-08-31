'use client';

import React from "react";
import {UnactiveError} from "@/error/unactiveError";
import styles from './RoundButton.module.css'

export type RoundButtonParam = {
    label: string;
    backgroundColor: React.CSSProperties['backgroundColor'];
    fontSize: React.CSSProperties['fontSize'];
    toggle?: boolean;
    onClick: () => void;
}

type RoundButtonProps = { roundButtonParam: RoundButtonParam };

export function RoundButton({ roundButtonParam }: RoundButtonProps) {
    // 활성화 상태
    const [active, setActive] = React.useState(true);
    const toggle = roundButtonParam.toggle ?? true;

    const handleClick = async () => {
        if(toggle) setActive((active) => !active);

        try {
            roundButtonParam.onClick();
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
            className={[styles.roundButton, styles.roundButtonFont, active ? styles.roundButtonActive : styles.roundButtonInactive].join(' ')}
            style={{fontSize: roundButtonParam.fontSize}}
            aria-pressed={active}
            onClick={handleClick}
        > {/* 폰트 크기와 배경색은 인자 값으로 변경 가능하다. */}
            {roundButtonParam.label}
        </button>
    );
}
