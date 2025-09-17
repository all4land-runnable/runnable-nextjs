"use client";

import React from "react";
import styles from "./RouteOptionSlider.module.scss";

type Guide = { name: string; value: number };

type RouteOptionSliderProps = {
    /** 좌측 레이블 */
    label: string;
    /** 현재 값 */
    value: number;
    /** 현재 값 표기 포맷 (ex: "4.2 km", "6'30''/km") */
    formatValue: string;
    /** 최소/최대/스텝 */
    min: number;
    max: number;
    step?: number;
    /** 활성화 여부 (기본값: true) */
    active?: boolean;
    /** 값 변경 콜백 */
    onSlideAction: (value: number) => void;
    /** 활성/비활성 토글 콜백 */
    onToggleAction: (next: boolean) => void;
    /** 가이드 버튼(프리셋) 목록 */
    optionButtons?: Guide[];
};

// CSSProperties에 커스텀 변수('--progress')를 추가
interface SliderStyle extends React.CSSProperties {
    "--progress"?: string;
}

export default function RouteOptionSlider({
                                              label,
                                              value,
                                              formatValue,
                                              min,
                                              max,
                                              step = 1,
                                              active = true,
                                              onSlideAction,
                                              onToggleAction,
                                              optionButtons = [],
                                          }: RouteOptionSliderProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = Number(e.target.value);
        if (!Number.isNaN(next)) onSlideAction(next);
    };

    const clamp = (x: number) => Math.min(max, Math.max(min, x));
    const progress = ((clamp(value) - min) * 100) / (max - min);

    const sliderStyle: SliderStyle = { "--progress": `${progress}%` };

    return (
        <div
            className={[
                styles.routeOptionSlider,
                active ? styles.active : styles.inactive,
                // 필요 시 고정비율을 쓰고 싶다면 아래 클래스만 추가로 붙이면 됨: styles.fixedRatio
            ].join(" ")}
            aria-disabled={!active}
        >
            {/* 헤더 */}
            <div className={styles.header}>
                <div className={styles.leftHeader}>
                    <span className={styles.title}>{label}</span>
                    <span className={styles.unit}>{formatValue}</span>
                </div>

                <div className={styles.rightHeader}>
                    {/* 가이드 버튼(프리셋) */}
                    {optionButtons.length > 0 && (
                        <div className={styles.guides} role="list">
                            {optionButtons.map((opt) => {
                                const selected =
                                    Math.round(opt.value / step) === Math.round(value / step);
                                return (
                                    <button
                                        key={`${opt.name}-${opt.value}`}
                                        type="button"
                                        role="listitem"
                                        className={[
                                            styles.guideBtn,
                                            selected ? styles.guideSelected : "",
                                        ].join(" ")}
                                        onClick={() => onSlideAction(clamp(opt.value))}
                                        disabled={!active}
                                        aria-pressed={selected}
                                        title={`${opt.name} (${opt.value})`}
                                    >
                                        {opt.name}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* 별도 활성/비활성 버튼 */}
                    <button
                        type="button"
                        className={[styles.toggleBtn, active ? styles.on : styles.off].join(" ")}
                        aria-pressed={active}
                        onClick={() => onToggleAction(!active)}
                    >
                        {active ? "ON" : "OFF"}
                    </button>
                </div>
            </div>

            {/* 슬라이더 */}
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={clamp(value)}
                onChange={handleChange}
                style={sliderStyle}
                disabled={!active}
                className={styles.slider}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={clamp(value)}
            />
        </div>
    );
}
