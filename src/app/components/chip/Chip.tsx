'use client';

import React from 'react';
import styles from './Chip.module.css';

type ChipProps = {
    label?: string;
    backgroundColor?: React.CSSProperties['backgroundColor'];
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function Chip({label, backgroundColor}: ChipProps) {
    return (
        <button
            type="button"
            className={[styles.chip, styles.chipFont].filter(Boolean).join(' ')}
            style={{backgroundColor}}
            aria-label={label}
        >
            {label}
        </button>
    );
}
