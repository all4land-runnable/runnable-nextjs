'use client'

import {
    Area, ComposedChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip,
    ReferenceDot, Label
} from 'recharts';
import styles from './SlopeGraph.module.css';

import addSlope from "@/app/components/molecules/slope-graph/util/addSlope";
import initXTick from "@/app/components/molecules/slope-graph/util/initXTick";
import segmentBySlope from "@/app/components/molecules/slope-graph/util/segmentBySlope";
import formatKmTick from "@/app/components/molecules/slope-graph/util/formatKmTick";
import { formatKm } from "@/app/utils/claculator/formatKm";

import type { Section } from "@/type/section";
import type { Point } from "@/type/point";
import {useSelector} from "react-redux";
import {RootState} from "@/app/store/redux/store";

// addSlope가 기대하는 최소 형태
type BaseDatum = { meter: number; height: number };
// addSlope 결과(경사도 포함)
type SlopeDatum = BaseDatum & { slope: number };

export default function SlopeGraph() {
    const automaticRoute = useSelector((state: RootState) => state.rightSideBar.automaticRoute);

    const tempRoute = useSelector((state: RootState) => state.rightSideBar.tempRoute);
    const pedestrianRoute = useSelector((state: RootState) => state.rightSideBar.pedestrianRoute);

    const route = automaticRoute ? pedestrianRoute : tempRoute;
    // 1) route → flat points → {meter,height} → 거리 오름차순 정렬
    const base: BaseDatum[] = route.sections
        .flatMap((s: Section) =>
            s.points.map((p: Point) => ({ meter: p.distance, height: p.height }))
        )
        .sort((a, b) => a.meter - b.meter);

    // 2) 경사도 계산
    const data: SlopeDatum[] = addSlope(base);

    // 3) 보조 통계/축 계산
    const meters = data.map(d => d.meter);
    const heights = data.map(d => d.height);

    const meterFirst = Math.min(...meters);
    const meterLast  = Math.max(...meters);

    const heightMin = Math.min(...heights);
    const heightMax = Math.max(...heights);

    const minIdx = heights.indexOf(heightMin);
    const maxIdx = heights.indexOf(heightMax);

    const meterAtMin = data[minIdx]?.meter;
    const meterAtMax = data[maxIdx]?.meter;

    const Y_STEP = 5; // y축 눈금 간격(m)
    const yDomainMin = Math.floor(heightMin / Y_STEP) * Y_STEP;
    const yDomainMax = Math.ceil(heightMax / Y_STEP) * Y_STEP;

    const yTicks: number[] = [];
    for (let v = yDomainMin; v <= yDomainMax; v += Y_STEP) yTicks.push(v);

    const xTicks = initXTick(meterLast, 500); // 500m 간격

    // 4) 오르막/내리막 분할
    const { up, down } = segmentBySlope(data);

    // 5) Tooltip
    type CustomTooltipProps = {
        active?: boolean;
        payload?: Array<{ payload: SlopeDatum }>;
    };

    const SlopeTooltip = ({ active, payload }: CustomTooltipProps) => {
        if (!active || !payload || payload.length === 0) return null;
        const item = payload.find(e => typeof e.payload.slope === 'number');
        if (!item) return null;

        const p = item.payload;
        return (
            <div style={{
                background: 'rgba(255,255,255,0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: '8px 10px',
                lineHeight: 1.4
            }}>
                <div><strong>이동 거리</strong> : {formatKm(p.meter)}</div>
                <div><strong>고도</strong> : {`${p.height.toFixed(0)}m`}</div>  {/* ✅ 고도는 m 단위 */}
                <div><strong>경사도</strong> : {`${p.slope >= 0 ? '+' : ''}${p.slope.toFixed(1)}%`}</div>
            </div>
        );
    };

    return (
        <section>
            <div className={styles.slopeGraph}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="5 5" />

                        <XAxis
                            dataKey="meter"
                            type="number"
                            ticks={xTicks}
                            allowDecimals
                            tickFormatter={(xTick: number) => formatKmTick(xTick, meterLast)}
                        />

                        <YAxis
                            type="number"
                            domain={[yDomainMin, yDomainMax]}
                            ticks={yTicks}
                            allowDecimals={false}
                            tickFormatter={(v: number) => `${v}m`}
                        />

                        <Tooltip content={SlopeTooltip} cursor={{ strokeDasharray: '3 3' }} />

                        {/* 높이 면 */}
                        <Area
                            type="monotone"
                            dataKey="height"
                            stroke="#FFFFFF"
                            fill="#FFFFFF"
                            dot={false}
                            isAnimationActive={false}
                        />

                        {/* 상승(빨강) / 하강(파랑) */}
                        <Line
                            type="monotone"
                            data={up}
                            dataKey="height"
                            stroke="#ff4d4f"
                            strokeWidth={3}
                            dot={false}
                            isAnimationActive={false}
                            connectNulls={false}
                        />
                        <Line
                            type="monotone"
                            data={down}
                            dataKey="height"
                            stroke="#1e63ff"
                            strokeWidth={3}
                            dot={false}
                            isAnimationActive={false}
                            connectNulls={false}
                        />

                        {/* 최저점 */}
                        <ReferenceDot x={meterAtMin} y={heightMin} r={4} fill="#1e63ff" stroke="#000">
                            <Label value={`${heightMin.toFixed(0)}m`} position="bottom" style={{ fontSize: 14 }} />
                        </ReferenceDot>

                        {/* 최고점 */}
                        <ReferenceDot x={meterAtMax} y={heightMax} r={4} fill="#ff4d4f" stroke="#000">
                            <Label value={`${heightMax.toFixed(0)}m`} position="top" style={{ fontSize: 14 }} />
                        </ReferenceDot>
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}
