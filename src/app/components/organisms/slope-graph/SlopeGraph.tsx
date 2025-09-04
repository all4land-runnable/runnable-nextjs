'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import styles from './SlopeGraph.module.css'
import { remToPx } from "@/app/utils/claculator/pxToRem";

export type SlopeGraphParam = {
    meter: number;
    height: number;
}

type SlopeGraphProps = {
    slopeGraphParams: SlopeGraphParam[];
}

// ---- helpers: 구간 반올림 & 틱 생성 ----
const floorToStep = (n: number, step: number) => Math.floor(n / step) * step;
const ceilToStep  = (n: number, step: number) => Math.ceil(n / step) * step;

// X축 500m 간격 + 마지막 meter를 끝 틱으로 포함
function buildXTicks(mMin: number, lastMeter: number, step = 500): number[] {
    const start = floorToStep(mMin, step);
    const ticks: number[] = [];
    for (let v = start; v <= lastMeter; v += step) ticks.push(v);
    const lastGrid = floorToStep(lastMeter, step);
    if (lastMeter !== lastGrid) ticks.push(lastMeter); // 마지막이 500 배수가 아니면 추가
    return ticks;
}

export default function SlopeGraph({ slopeGraphParams }: SlopeGraphProps) {
    // 빈 배열 방어
    const safeData = slopeGraphParams.length ? slopeGraphParams : [{ meter: 0, height: 0 }, { meter: 1000, height: 0 }];

    // 데이터의 "마지막" 거리(배열이 시간/거리 순으로 정렬되어 있다고 가정)
    const mLast = safeData[safeData.length - 1].meter;
    const mMin  = Math.min(...safeData.map(d => d.meter));

    // Y범위 계산 (5m 간격)
    const heights = safeData.map(d => d.height);
    const hMin = Math.min(...heights);
    const hMax = Math.max(...heights);
    const Y_STEP = 5;
    const yDomainMin = floorToStep(hMin, Y_STEP);
    const yDomainMax = ceilToStep(hMax, Y_STEP);
    const yTicks = (() => {
        const out: number[] = [];
        for (let v = yDomainMin; v <= yDomainMax; v += Y_STEP) out.push(v);
        return out;
    })();

    // X축: 마지막 값에서 종료, 중간은 500m
    const xTicks = buildXTicks(mMin, mLast, 500);

    return (
        <section>
            <div className={styles.slopeGraph}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        width={remToPx(58.125)}
                        height={remToPx(18.75)}
                        data={safeData}
                        margin={{
                            top: remToPx(0.5),
                            right: remToPx(0.75),
                            left: remToPx(0.75),
                            bottom: remToPx(0.5),
                        }}
                    >
                        <CartesianGrid strokeDasharray="5 5" />

                        {/* 좌우: 500m 간격, 끝은 마지막 meter로 고정 */}
                        <XAxis
                            dataKey="meter"
                            type="number"
                            domain={[mMin, mLast]}         // 마지막 거리를 차트의 끝으로
                            ticks={xTicks}
                            tickFormatter={(v: number) => v.toFixed(2)}
                            allowDecimals
                        />

                        {/* 상하: 5m 간격 */}
                        <YAxis
                            type="number"
                            domain={[yDomainMin, yDomainMax]}
                            ticks={yTicks}
                            allowDecimals={false}
                        />
                        <Area type="monotone" dataKey="height" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}
