'use client';

import React, {useState} from "react";
import styles from './page.module.css'
import TileChips from "@/app/components/molecules/tile-chips/TileChips";
import EmphasizeChips from "@/app/components/molecules/emphasize-chips/EmphasizeChips";
import DrawingChips from "@/app/components/molecules/drawing-chips/DrawingChips";
import RouteOptionSlider from "@/app/components/organisms/route-option-slider/RouteOptionSlider";
import {formatKm} from "@/app/utils/claculator/formatKm";
import {formatKg} from "@/app/utils/claculator/formatKg";
import {formatPace} from "@/app/utils/claculator/formatPace";

/**
 * 홈 화면을 구현하는 함수
 * @constructor
 */
export default function Page() {
    // 거리 제한(meter)
    const [limitActive, setLimitActive] = useState<boolean>(false);
    const [limitRange, setLimitRange] = useState<number>(5);

    // 짐 무게 (kg)
    const [luggageActive, setLuggageActive] = useState(false);
    const [luggageWeight, setLuggageWeight] = useState(1.5);

    // 희망 속도 (분/㎞를 초로 가정: 180(3'00") ~ 480(8'00"))
    const [paceActive, setPaceActive] = useState(false);
    const [paceSeconds, setPaceSeconds] = useState(360); // 6'00" = 360초

    return (
        <>
            <div className={styles.onViewer}>
                <div className={styles.topSheet}>
                    <EmphasizeChips/> {/* 구역 강조 버튼 모음 */}
                    <TileChips/> {/* 타일 버튼 모음 */}
                </div>
            </div>

            <section className={styles.bottomSheet}>
                <DrawingChips/>
            </section>

            <div className={styles.routeOptions}>
                {/* 짐 무게 */}
                <RouteOptionSlider
                    label="거리 제한"
                    value={limitRange}
                    formatValue={formatKm(limitRange)}
                    min={0}
                    max={50}
                    step={0.1}
                    active={limitActive}
                    onSlideAction={setLimitRange}
                    onToggleAction={setLimitActive}
                />

                {/* 짐 무게 */}
                <RouteOptionSlider
                    label="짐 무게"
                    value={luggageWeight}
                    formatValue={formatKg(luggageWeight*1000)}
                    min={0}
                    max={20}
                    step={1}
                    active={luggageActive}
                    onSlideAction={setLuggageWeight}
                    onToggleAction={setLuggageActive}
                />

                {/* 희망 속도 */}
                <RouteOptionSlider
                    label="희망 속도"
                    value={paceSeconds}
                    formatValue={formatPace(paceSeconds)}
                    min={180}  // 3'00"
                    max={600}  // 10'00"
                    step={5}
                    active={paceActive}
                    onSlideAction={setPaceSeconds}
                    onToggleAction={setPaceActive}
                />
            </div>
        </>
    )
}
