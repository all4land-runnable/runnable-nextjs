"use client";

import React, { useState } from "react";
import RouteOptionSlider from "@/app/components/organisms/route-option-slider/RouteOptionSlider";

export default function RouteOptionExamplePage() {
    // 짐 무게 (kg)
    const [luggageActive, setLuggageActive] = useState(true);
    const [luggageWeight, setLuggageWeight] = useState(10);

    // 희망 속도 (분/㎞를 초로 가정: 180(3'00") ~ 480(8'00"))
    const [paceActive, setPaceActive] = useState(false);
    const [paceSeconds, setPaceSeconds] = useState(360); // 6'00" = 360초

    return (
        <main
            style={{
                maxWidth: 780,
                margin: "40px auto",
                padding: "0 20px 60px",
                display: "grid",
                gap: 20,
            }}
        >
            {/* 짐 무게 */}
            <RouteOptionSlider
                label="짐 무게"
                value={luggageWeight}
                min={0}
                max={30}
                step={1}
                active={luggageActive}
                onSlideAction={setLuggageWeight}
                onToggleAction={setLuggageActive}
            />

            {/* 희망 속도 */}
            <RouteOptionSlider
                label="희망 속도"
                value={paceSeconds}
                min={180}  // 3'00"
                max={480}  // 8'00"
                step={5}
                active={paceActive}
                onSlideAction={setPaceSeconds}
                onToggleAction={setPaceActive}
            />
        </main>
    );
}
