// src/app/components/molecules/slope-graph/SlopeGraph.tsx
'use client'

import {
    Area, ComposedChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip,
    ReferenceDot, Label
} from 'recharts';
import styles from './SlopeGraph.module.css';

import addSlope from '@/app/components/molecules/slope-graph/util/addSlope';
import initXTick from '@/app/components/molecules/slope-graph/util/initXTick';
import segmentBySlope from '@/app/components/molecules/slope-graph/util/segmentBySlope';
import formatKmTick from '@/app/components/molecules/slope-graph/util/formatKmTick';
import { formatKm } from '@/app/utils/claculator/formatKm';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/store/redux/store';
import type { Point, Route, Section } from '@/type/route';

// ===== 타입 =====
export type SlopeGraphParam = { meter: number; height: number };
export type SlopeDatum = SlopeGraphParam & { slope: number; pace?: string };

// ===== Route -> SlopeGraphParam 변환 =====
function buildSlopeParamsFromRoute(route?: Route): SlopeGraphParam[] {
    if (!route?.sections?.length) return [];

    // 섹션들의 포인트를 펼치면서 [meter, height] 채집
    const raw: SlopeGraphParam[] = route.sections.flatMap((s: Section) =>
        s.points.map((p: Point) => ({
            meter: Number.isFinite(p.distance) ? p.distance : 0,
            height: Number.isFinite(p.height) ? p.height : 0,
        }))
    );

    // 거리 기준 정렬 + 동일 meter 중복 제거(가장 마지막 값 사용)
    const sorted = raw.sort((a, b) => a.meter - b.meter);
    const dedup: SlopeGraphParam[] = [];
    for (const r of sorted) {
        const last = dedup[dedup.length - 1];
        if (!last || last.meter !== r.meter) {
            dedup.push(r);
        } else {
            // 같은 meter가 연속으로 오면 최신 height로 갱신
            last.height = r.height;
        }
    }

    return dedup;
}

export default function SlopeGraph() {
    // 요청사항: 컴포넌트 안에서 useDispatch 사용 (필요 시 활용)
    const dispatch = useDispatch();

    // 자동경로/임시경로 선택
    const automaticRoute = useSelector((state: RootState) => state.rightSideBar.automaticRoute);
    const tempRoute       = useSelector((state: RootState) => state.routeDrawing.tempRoute);
    const pedestrianRoute = useSelector((state: RootState) => state.routeDrawing.pedestrianRoute);

    // true면 보행자(자동) 경로, false면 임시 경로
    const route: Route | undefined = automaticRoute ? pedestrianRoute : tempRoute;

    // Route -> 그래프 파라미터
    const params: SlopeGraphParam[] = buildSlopeParamsFromRoute(route);

    if (params.length === 0) {
        return (
            <section>
                <div className={styles.slopeGraph}
                     style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                    경로 데이터가 없습니다.
                </div>
            </section>
        );
    }

    // 경사도 부여
    const data: SlopeDatum[] = addSlope(params);

    // 보조 통계/축
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

    // Tooltip
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

                        {/* 최저/최고점 */}
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
