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

    const fmtPace = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}'${String(s).padStart(2, "0")}" /km`;
    };

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
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
                RouteOptionSlider Demo
            </h1>
            <p style={{ color: "#666", marginBottom: 10 }}>
                좌측 라벨, 우측 링 토글(활성/비활성), 하단 슬라이더 UI를 확인해보세요.
            </p>

            {/* 짐 무게 */}
            <RouteOptionSlider
                label="짐 무게"
                value={luggageWeight}
                min={0}
                max={30}
                step={1}
                active={luggageActive}
                onChange={setLuggageWeight}
                onToggleActive={setLuggageActive}
                ariaLabel="짐 무게 슬라이더"
            />
            <div style={{ textAlign: "right", color: "#444" }}>
                현재 짐 무게: <strong>{luggageWeight} kg</strong>
            </div>

            {/* 희망 속도 */}
            <RouteOptionSlider
                label="희망 속도"
                value={paceSeconds}
                min={180}  // 3'00"
                max={480}  // 8'00"
                step={5}
                active={paceActive}
                onChange={setPaceSeconds}
                onToggleActive={setPaceActive}
                ariaLabel="희망 속도 슬라이더"
            />
            <div style={{ textAlign: "right", color: "#444" }}>
                현재 희망 속도: <strong>{fmtPace(paceSeconds)}</strong>
            </div>

            <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid #eee" }} />

            <section
                style={{
                    background: "#fafafa",
                    border: "1px solid #eee",
                    borderRadius: 12,
                    padding: 16,
                    lineHeight: 1.7,
                }}
            >
                <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>요약</h2>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                    <li>
                        짐 무게:{" "}
                        <strong>
                            {luggageActive ? `${luggageWeight} kg` : "비활성화됨"}
                        </strong>
                    </li>
                    <li>
                        희망 속도:{" "}
                        <strong>{paceActive ? fmtPace(paceSeconds) : "비활성화됨"}</strong>
                    </li>
                </ul>
            </section>
        </main>
    );
}
