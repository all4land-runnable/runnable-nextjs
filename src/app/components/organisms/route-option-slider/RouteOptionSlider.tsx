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
    onSlideAction: (value: number) => void;
    /** 활성/비활성 토글 콜백 (우측 링 버튼 클릭) */
    onToggleAction: (next: boolean) => void;
};

export default function RouteOptionSlider({label, value, min, max, step = 1, active = false, onSlideAction, onToggleAction}: RouteOptionSliderProps) {
    // 슬라이더의 값이 변경되면 일어나는 동작
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = Number(e.target.value);
        if (!Number.isNaN(next)) onSlideAction(next);
    };

    return (
        <div className={[styles.routeOptionSlider, active ? styles.active : styles.inactive,].join(" ")}>
            <div className={styles.header}>
                <span className={styles.label}>{label}</span> {/* 슬라이더 설명 */}

                {/* 우측 원형 토글 (꽉 찬/비어있는 링) */}
                <svg
                    role="button" width={21} height={21} viewBox="0 0 21 21" className={styles.toggle}
                    onClick={() => onToggleAction(!active)}
                    xmlns="http://www.w3.org/2000/svg"
                    aria-pressed={active}
                >
                    <circle cx="10.5" cy="10.5" r={9} stroke="#FAD05A" strokeWidth={3} fill="none"/> {/* 바깥 링 */}
                    {active && (<circle cx="10.5" cy="10.5" r={5.0} fill="#FAD05A"/>)} {/* 활성 점(원하는 크기로) */}
                </svg>
            </div>

            <input
                type="range"
                min={min} // 최소값
                max={max} // 최대 값
                step={step} // 한 칸단 이동 량
                value={value} // 현재 값
                onChange={handleChange} // 값 변동 시 함수
                disabled={!active} // 비활성화 여부
                className={styles.slider} // 디자인
            />
        </div>
    );
}
