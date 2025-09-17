'use client';

import React from 'react';
import styles from './Chip.module.scss';
import { UnactiveError } from "@/error/unactiveError";

type ChipProps = {
    label: string;
    activable?: boolean;
    onClickAction: () => void | Promise<void>;
    inActiveOnClickAction?: () => void | Promise<void>;
};

export function Chip({ label, activable = true, onClickAction, inActiveOnClickAction }: ChipProps) {
    const [active, setActive] = React.useState(true);
    const [pressed, setPressed] = React.useState(false);

    const handleClick = async () => {
        try {
            if (inActiveOnClickAction != null && !active) await inActiveOnClickAction();
            else await onClickAction();

            if (activable) setActive(!active);
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
            className={[
                styles.chip,
                styles.chipFont,
                active ? styles.chipActive : styles.chipInactive,
            ].join(' ')}
            aria-pressed={active}
            data-pressed={pressed}
            onPointerDown={() => setPressed(true)}
            onPointerUp={() => setPressed(false)}
            onPointerLeave={() => setPressed(false)}
            onClick={handleClick}
        >
            {label}
        </button>
    );
}
