// app/components/organisms/route-option-slider/RouteOptionSlider.tsx
"use client";

import React from "react";
import styles from "./RouteOptionSlider.module.css";

type RouteOptionSliderProps = {
    /** 카드 좌측 레이블 텍스트 */
    label: string;
    /** 현재 값 */
    value: number;
    /** 최소/최대/스텝 */
    min: number;
    max: number;
    step?: number;
    /** 활성화 여부 (기본값: true) */
    active?: boolean;
    /** 값 변경 콜백 */
    onChange: (value: number) => void;
    /** 활성/비활성 토글 콜백 (우측 링 버튼 클릭) */
    onToggleActive?: (next: boolean) => void;
    /** 추가 wrapper className (선택) */
    className?: string;
    /** 슬라이더의 aria-label (선택) */
    ariaLabel?: string;
};

export default function RouteOptionSlider({
                                              label,
                                              value,
                                              min,
                                              max,
                                              step = 1,
                                              active = true,
                                              onChange,
                                              onToggleActive,
                                              className = "",
                                              ariaLabel,
                                          }: RouteOptionSliderProps) {
    const pct =
        max === min ? 0 : Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = Number(e.target.value);
        if (!Number.isNaN(next)) onChange(next);
    };

    const cardClass = [
        styles.rosCard,
        active ? styles.active : styles.inactive,
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={cardClass}>
            <div className={styles.rosHead}>
                <span className={styles.rosLabel}>{label}</span>

                {/* 우측 원형 토글 (꽉 찬/비어있는 링) */}
                <button
                    type="button"
                    aria-pressed={active}
                    aria-label={active ? "옵션 비활성화" : "옵션 활성화"}
                    className={`${styles.rosToggle} ${active ? styles.on : styles.off}`}
                    onClick={() => onToggleActive?.(!active)}
                >
                    <span className={styles.ring} />
                    <span className={styles.dot} />
                </button>
            </div>

            <div className={styles.rosRangeWrap}>
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    aria-label={ariaLabel ?? label}
                    onChange={handleChange}
                    disabled={!active}
                    className={styles.rosRange}
                />
            </div>
        </div>
    );
}
