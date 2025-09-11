// src/app/components/molecules/slope-graph/SlopeGraph.tsx
'use client';

import {
    Area, ComposedChart, Line, ResponsiveContainer,
    CartesianGrid, XAxis, YAxis, Tooltip, ReferenceDot, Label
} from 'recharts';
import styles from './SlopeGraph.module.css';

import initXTick from "@/app/components/molecules/slope-graph/util/initXTick";
import segmentBySlope from "@/app/components/molecules/slope-graph/util/segmentBySlope";
import formatKmTick from "@/app/components/molecules/slope-graph/util/formatKmTick";
import { formatKm } from "@/app/utils/claculator/formatKm";

import { useSelector } from "react-redux";
import { RootState } from "@/app/store/redux/store";

import routeToSlopeParams, { SlopeGraphParam } from "./util/routeToSlopeParams";

// addSlope가 기대하는 최소 형태
type SlopeDatum = SlopeGraphParam & { slope: number };

function addSlope(rows: SlopeGraphParam[]): SlopeDatum[] {
    return rows.map((d, i) => {
        if (i === 0) return { ...d, slope: 0 };
        const dx = d.meter - rows[i - 1].meter;
        const dz = d.height - rows[i - 1].height;
        return { ...d, slope: dx !== 0 ? (dz / dx) * 100 : 0 };
    });
}

export default function SlopeGraph() {
    // 기존 코드 스타일 그대로: 오른쪽 사이드바의 라우트들에서 스위칭
    const automaticRoute = useSelector((s: RootState) => s.rightSideBar.automaticRoute);

    const tempRoute      = useSelector((s: RootState) => s.routeDrawing.tempRoute);
    const pedestrianRoute= useSelector((s: RootState) => s.routeDrawing.pedestrianRoute);

    const route = automaticRoute ? pedestrianRoute : tempRoute;

    // Route → 그래프 데이터
    const base: SlopeGraphParam[] = routeToSlopeParams(route);
    if (base.length === 0) {
        return (
            <section>
                <div className={styles.slopeGraph}
                     style={{display:'flex',alignItems:'center',justifyContent:'center',color:'#888'}}>
                    경로 데이터가 없습니다.
                </div>
            </section>
        );
    }

    const data: SlopeDatum[] = addSlope(base);

    // 축/라벨 계산
    const meters  = data.map(d => d.meter);
    const heights = data.map(d => d.height);

    const meterLast = Math.max(...meters);
    const heightMin = Math.min(...heights);
    const heightMax = Math.max(...heights);

    const minIdx = heights.indexOf(heightMin);
    const maxIdx = heights.indexOf(heightMax);

    const meterAtMin = data[minIdx]?.meter ?? 0;
    const meterAtMax = data[maxIdx]?.meter ?? 0;

    const Y_STEP = 5;
    const yDomainMin = Math.floor(heightMin / Y_STEP) * Y_STEP;
    const yDomainMax = Math.ceil(heightMax / Y_STEP) * Y_STEP;
    const yTicks: number[] = [];
    for (let v = yDomainMin; v <= yDomainMax; v += Y_STEP) yTicks.push(v);

    const xTicks = initXTick(meterLast, 500);

    // 오르막/내리막 분리
    const { up, down } = segmentBySlope(data);

    // 툴팁
    type CustomTooltipProps = { active?: boolean; payload?: Array<{ payload: SlopeDatum }>; };
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
                <div><strong>고도</strong> : {`${p.height.toFixed(0)}m`}</div>
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

                        {/* 지형 면 */}
                        <Area
                            type="monotone"
                            dataKey="height"
                            stroke="#FFFFFF"
                            fill="#FFFFFF"
                            dot={false}
                            isAnimationActive={false}
                        />

                        {/* 오르막/내리막 라인 */}
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

                        {/* 최저/최고점 표시 */}
                        <ReferenceDot x={meterAtMin} y={heightMin} r={4} fill="#1e63ff" stroke="#000">
                            <Label value={`${heightMin.toFixed(0)}m`} position="bottom" style={{ fontSize: 14 }} />
                        </ReferenceDot>
                        <ReferenceDot x={meterAtMax} y={heightMax} r={4} fill="#ff4d4f" stroke="#000">
                            <Label value={`${heightMax.toFixed(0)}m`} position="top" style={{ fontSize: 14 }} />
                        </ReferenceDot>
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}
