'use client';

import React, { useMemo } from 'react';
import styles from './SlopeGraph.module.css';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/redux/store';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Line, ReferenceDot, ResponsiveContainer,
} from 'recharts';
import { Route } from '@/type/route';
import {formatKm} from "@/app/utils/claculator/formatKm";
import {renderTooltip} from "@/app/components/molecules/slope-graph/utils/renderTooltip";

export type GraphDatum = {
    /** X축은 인덱스(0..N-1). 실제 거리는 index * STEP_M 로 환산 */
    distance: number;       // index
    height: number;         // meters
    slope: number;          // %
    heightPos?: number|null;
    heightNeg?: number|null;
};

const STEP_M = 25; // 25 m 재샘플링 간격
const KM = 1000;
const EPS = 0.05;  // 경사 0% 근처 허용 오차

/** (distance[m], height[m]) 배열 구성 */
function collectDistanceHeightPairs(route?: Route): Array<{d:number; h:number}> {
    if (!route?.sections?.length) return [];
    const pairs: Array<{d:number; h:number}> = [];
    for (const sec of route.sections) {
        for (const p of (sec.points ?? [])) {
            const d = Number(p.distance ?? 0);
            const h = Number(p.height ?? 0);
            if (Number.isFinite(d) && Number.isFinite(h)) pairs.push({ d, h });
        }
    }
    pairs.sort((a,b)=>a.d - b.d);
    const dedup: Array<{d:number; h:number}> = [];
    let lastD = Number.NaN;
    for (const pr of pairs) {
        if (pr.d === lastD) {
            dedup[dedup.length - 1] = pr;
        } else {
            dedup.push(pr);
            lastD = pr.d;
        }
    }
    if (dedup.length) {
        if (dedup[0].d > 0) dedup.unshift({ d: 0, h: dedup[0].h });
        const total = Math.max(route?.distance ?? dedup[dedup.length-1].d, dedup[dedup.length-1].d);
        if (dedup[dedup.length-1].d < total) dedup.push({ d: total, h: dedup[dedup.length-1].h });
    }
    return dedup;
}

/** 두 점 (d0,h0)~(d1,h1)에서 d에 대한 선형보간 높이 */
function lerpHeight(d0:number, h0:number, d1:number, h1:number, d:number): number {
    if (d1 === d0) return h0;
    const t = (d - d0) / (d1 - d0);
    return h0 + t * (h1 - h0);
}

/** Route → STEP_M 간격 재샘플링 GraphDatum[] (X축=인덱스) */
function routeToGraphData(route?: Route): GraphDatum[] {
    const pairs = collectDistanceHeightPairs(route);
    if (!pairs.length) return [];

    const totalDist = Math.max(route?.distance ?? 0, pairs[pairs.length-1].d);
    const sampleCount = Math.max(2, Math.floor(totalDist / STEP_M) + 1);
    const out: GraphDatum[] = new Array(sampleCount);

    let j = 0; // 보간 구간 포인터
    for (let i = 0; i < sampleCount; i++) {
        const dist = i * STEP_M;
        while (j+1 < pairs.length && dist > pairs[j+1].d) j++;
        const left = pairs[j];
        const right = pairs[Math.min(j+1, pairs.length-1)];
        const h = lerpHeight(left.d, left.h, right.d, right.h, dist);
        out[i] = { distance: i, height: h, slope: 0, heightPos: null, heightNeg: null };
    }

    // 경사(%) 계산: Δh / Δs * 100  (Δs = STEP_M)
    for (let i = 0; i < sampleCount; i++) {
        let dh: number;
        if (i === 0) dh = out[i+1].height - out[i].height;
        else if (i === sampleCount - 1) dh = out[i].height - out[i-1].height;
        else dh = (out[i+1].height - out[i-1].height) / 2;

        const slopePct = (dh / STEP_M) * 100;
        out[i].slope = slopePct;

        // 0% 근처 안정화: -EPS ~ +EPS 는 양수쪽에 포함(면과 라인이 틈 없이 붙게)
        const isPos = slopePct >= -EPS;
        out[i].heightPos = isPos ? out[i].height : null;
        out[i].heightNeg = isPos ? null : out[i].height;
    }

    return out;
}

export default function SlopeGraph() {
    // 어떤 Route를 그릴지 선택 (boolean: true면 pedestrian, false면 temp) — 프로젝트 로직 준수
    const usePedestrian = useSelector((s: RootState) => s.rightSideBar.automaticRoute);
    const pedestrianRoute = useSelector((s: RootState) => s.routeDrawing.pedestrianRoute) as Route | undefined;
    const tempRoute       = useSelector((s: RootState) => s.routeDrawing.tempRoute) as Route | undefined;

    const route: Route | undefined = usePedestrian ? tempRoute : pedestrianRoute;

    const data  = useMemo(() => routeToGraphData(route), [route]);

    // X축 최대값 = 마지막 인덱스
    const xMax = useMemo(() => (data.length ? data.length - 1 : 1), [data]);

    // Y 범위
    const yMinData = useMemo(() => (data.length ? Math.min(...data.map(d=>d.height)) : -10), [data]);
    const yMaxData = useMemo(() => (data.length ? Math.max(...data.map(d=>d.height)) : 10), [data]);
    const yPad = Math.max(10, (yMaxData - yMinData) * 0.15);
    const yDomain: [number, number] = [yMinData - yPad, yMaxData + yPad];

    // 최대/최소 포인트
    const minIdx = useMemo(
        () => data.length ? data.reduce((mi,cur,idx,arr)=> cur.height < arr[mi].height ? idx : mi, 0) : -1,
        [data]
    );
    const maxIdx = useMemo(
        () => data.length ? data.reduce((mi,cur,idx,arr)=> cur.height > arr[mi].height ? idx : mi, 0) : -1,
        [data]
    );
    const minP = minIdx >= 0 ? data[minIdx] : undefined;
    const maxP = maxIdx >= 0 ? data[maxIdx] : undefined;

    // 1km 간격 tick + 마지막 인덱스 포함
    const kmTicks = useMemo(() => {
        if (!data.length) return [0];
        const ticks:number[] = [];
        const totalMeters = xMax * STEP_M;
        const totalKmInt = Math.floor(totalMeters / KM);
        for (let k=0; k<=totalKmInt; k++) ticks.push(Math.round((k*KM) / STEP_M));
        if (!ticks.includes(xMax)) ticks.push(xMax);
        return ticks;
    }, [data.length, xMax]);

    // 마지막 tick은 소수점 1자리, 기타는 정수 km
    const kmTickFormatterFromIndex = (idx: number) => {
        const km = (idx * STEP_M) / 1000;
        return (idx === xMax) ? `${km.toFixed(1)}km` : `${km.toFixed(0)}km`;
    };

    if (!data.length) {
        return <section className={styles.empty}>데이터가 없습니다.</section>;
    }

    return (
        <section>
            <div className={styles.slopeGraph}>
                {/* 447:221 비율 고정 박스 */}
                <div className={styles.ratioBox}>
                    <ResponsiveContainer width="100%" height="100%">
                        {/* 좌우 대칭 마진 + 우측 쏠림 방지 */}
                        <AreaChart
                            data={data}
                            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="6 6" />

                            <XAxis
                                dataKey="distance"           // index
                                type="number"
                                domain={[0, xMax]}
                                ticks={kmTicks}
                                tickFormatter={kmTickFormatterFromIndex}

                                /* ✅ 양끝 여백 제거 + 레이블 유지 */
                                padding={{ left: 0, right: 0 }}
                                allowDataOverflow
                                interval="preserveStartEnd"
                                tickMargin={6}
                            />
                            <YAxis
                                domain={yDomain}
                                tickFormatter={formatKm}
                                width={48}
                                tickLine={false}
                            />

                            <defs>
                                <linearGradient id="elevFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#F8D88C" stopOpacity={0.9}/>
                                    <stop offset="100%" stopColor="#F8D88C" stopOpacity={0.3}/>
                                </linearGradient>
                            </defs>

                            {/* ✅ 선/면이 딱 붙도록 linear 사용 */}
                            <Area
                                type="linear"
                                dataKey="height"
                                stroke="transparent"
                                fill="url(#elevFill)"
                                connectNulls
                                isAnimationActive={false}
                            />

                            {/* 경사 색상(양수=빨강, 음수=초록) */}
                            <Line
                                type="linear"
                                dataKey="heightPos"
                                stroke="#E84A5F"
                                dot={false}
                                connectNulls={false}
                                strokeWidth={2}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                isAnimationActive={false}
                            />
                            <Line
                                type="linear"
                                dataKey="heightNeg"
                                stroke="#38B000"
                                dot={false}
                                connectNulls={false}
                                strokeWidth={2}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                isAnimationActive={false}
                            />

                            {/* 최대/최소 포인트 */}
                            {minP && (
                                <ReferenceDot
                                    x={minIdx}
                                    y={minP.height}
                                    r={5}
                                    fill="#2BB673"
                                    stroke="white"
                                    strokeWidth={2}
                                    label={{ value: `${Math.round(minP.height)}m`, position: 'bottom', offset: 10, fill: '#333', fontSize: 12 }}
                                />
                            )}
                            {maxP && (
                                <ReferenceDot
                                    x={maxIdx}
                                    y={maxP.height}
                                    r={5}
                                    fill="#E84A5F"
                                    stroke="white"
                                    strokeWidth={2}
                                    label={{ value: `${Math.round(maxP.height)}m`, position: 'top', offset: 10, fill: '#333', fontSize: 12 }}
                                />
                            )}

                            {/* 툴팁: 인덱스→거리 환산 */}
                            <Tooltip
                                isAnimationActive={false}
                                content={renderTooltip}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </section>
    );
}
