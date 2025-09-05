'use client'

import {
    Area,
    ComposedChart,
    Line,
    ResponsiveContainer,
    CartesianGrid,
    XAxis,
    YAxis,
    ReferenceLine,
    Label,
    Tooltip,
} from 'recharts';
import styles from './SlopeGraph.module.css'
import { remToPx } from '@/app/utils/claculator/pxToRem';

export type SlopeGraphParam = {
    meter: number;   // 누적 거리 (m)
    height: number;  // 고도 (m)
};

type SlopeGraphProps = {
    slopeGraphParams: SlopeGraphParam[];
};

// --------------------------------------------------------
// helpers
// --------------------------------------------------------
const floorToStep = (n: number, step: number) => Math.floor(n / step) * step;
const ceilToStep  = (n: number, step: number) => Math.ceil(n / step) * step;

function buildXTicks(minMeter: number, lastMeter: number, step = 500): number[] {
    const start = floorToStep(minMeter, step);
    const ticks: number[] = [];
    for (let v = start; v <= lastMeter; v += step) ticks.push(v);
    if (ticks[ticks.length - 1] !== lastMeter) ticks.push(lastMeter); // 총거리 틱 포함
    return ticks;
}

// slope(%) 추가
type Datum = SlopeGraphParam & { slope: number };
function addSlope<T extends SlopeGraphParam>(arr: T[]): Datum[] {
    return arr.map((d, i) => {
        if (i === 0) return { ...d, slope: 0 };
        const dx = d.meter - arr[i - 1].meter;
        const dz = d.height - arr[i - 1].height;
        const slope = dx !== 0 ? (dz / dx) * 100 : 0; // %
        return { ...d, slope };
    });
}

// 상승/하강 분리용
type PlotPoint = { meter: number; height: number | null };

/** 기울기 부호에 따라 선 분리 + 섹션 중앙 x 계산 */
function segmentBySlope(data: SlopeGraphParam[]) {
    const n = data.length;
    const up: PlotPoint[] = data.map(d => ({ meter: d.meter, height: null }));
    const down: PlotPoint[] = data.map(d => ({ meter: d.meter, height: null }));
    const sign = (x: number) => (x > 0 ? 1 : x < 0 ? -1 : 0);

    const s: number[] = [];
    for (let i = 0; i < n - 1; i++) {
        const dh = data[i + 1].height - data[i].height;
        s[i] = sign(dh);
        if (s[i] > 0) {
            up[i].height = data[i].height;
            up[i + 1].height = data[i + 1].height;
        } else if (s[i] < 0) {
            down[i].height = data[i].height;
            down[i + 1].height = data[i + 1].height;
        }
    }

    const boundaries: number[] = [0];
    for (let j = 1; j < s.length; j++) if (s[j] !== s[j - 1]) boundaries.push(j);
    boundaries.push(n - 1);

    const sectionCenters: number[] = [];
    for (let k = 0; k < boundaries.length - 1; k++) {
        const a = boundaries[k];
        const b = boundaries[k + 1];
        sectionCenters.push((data[a].meter + data[b].meter) / 2);
    }
    return { up, down, sectionCenters };
}

// X축 라벨: km 표기
function formatKmTick(v: number, lastMeter: number) {
    const km = v / 1000;
    if (v === lastMeter) {
        const floored = Math.floor(km * 100) / 100; // 소수 둘째 자리 내림
        return `${Number.isInteger(floored) ? floored.toFixed(0) : floored.toFixed(2)}km`;
    }
    if (v % 1000 === 0) return `${km.toFixed(0)}km`;
    return `${(Math.round(km * 10) / 10).toFixed(1)}km`;
}

const formatMeters = (m: number) => `${m.toLocaleString()} m`;
const formatSlopePct = (p: number) => `${p >= 0 ? '+' : ''}${p.toFixed(1)}%`;

// --------------------------------------------------------
// Component
// --------------------------------------------------------
export default function SlopeGraph({ slopeGraphParams }: SlopeGraphProps) {
    const base: SlopeGraphParam[] = slopeGraphParams.length
        ? slopeGraphParams
        : [{ meter: 0, height: 0 }, { meter: 1000, height: 0 }];

    // 데이터에 slope(%) 추가
    const data: Datum[] = addSlope(base);

    // 범위 계산
    const mFirst = Math.min(...data.map(d => d.meter));
    const mLast  = Math.max(...data.map(d => d.meter));

    const heights = data.map(d => d.height);
    const hMin = Math.min(...heights);
    const hMax = Math.max(...heights);
    const Y_STEP = 5;
    const yDomainMin = floorToStep(hMin, Y_STEP);
    const yDomainMax = ceilToStep(hMax, Y_STEP);
    const yTicks: number[] = [];
    for (let v = yDomainMin; v <= yDomainMax; v += Y_STEP) yTicks.push(v);

    // X축 틱 (500m + 총거리)
    const xTicks = buildXTicks(mFirst, mLast, 500);

    // 상승/하강 라인 & 섹션 중앙
    const { up, down, sectionCenters } = segmentBySlope(data);

    // --- 커스텀 Tooltip (버전 독립 타입) ---
    type CustomTooltipProps = {
        active?: boolean;
        payload?: Array<{ payload: Datum }>;
    };
    const SlopeTooltip = ({ active, payload }: CustomTooltipProps) => {
        if (!active || !payload || payload.length === 0) return null;
        const p = payload[0].payload; // { meter, height, slope }
        return (
            <div style={{
                background: 'rgba(255,255,255,0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: '8px 10px',
                lineHeight: 1.4
            }}>
                <div><strong>이동 거리</strong> : {formatMeters(p.meter)}</div>
                <div><strong>고도</strong> : {p.height.toFixed(1)} m</div>
                <div><strong>경사도</strong> : {formatSlopePct(p.slope)}</div>
            </div>
        );
    };

    return (
        <section>
            <div className={styles.slopeGraph}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        width={remToPx(58.125)}
                        height={remToPx(18.75)}
                        data={data}
                    >
                        <CartesianGrid strokeDasharray="5 5" />

                        <XAxis
                            dataKey="meter"
                            type="number"
                            domain={[mFirst, mLast]}
                            ticks={xTicks}
                            allowDecimals
                            tickFormatter={(v: number) => formatKmTick(v, mLast)}
                        />

                        <YAxis
                            type="number"
                            domain={[yDomainMin, yDomainMax]}
                            ticks={yTicks}
                            allowDecimals={false}
                            tickFormatter={(v: number) => `${v}m`}
                        />

                        {/* 툴팁: 거리/고도/경사도 */}
                        <Tooltip content={SlopeTooltip} cursor={{ strokeDasharray: '3 3' }} />

                        {/* 면(배경색 유지) */}
                        <Area
                            type="monotone"
                            dataKey="height"
                            stroke="#8884d8"
                            fill="#8884d8"
                            fillOpacity={0.3}
                            dot={false}
                            isAnimationActive={false}
                        />

                        {/* 상승(빨강) / 하강(파랑) 라인 */}
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

                        {/* 섹션 중앙 라벨 */}
                        {sectionCenters.map((x, i) => (
                            <ReferenceLine
                                key={`section-${i}`}
                                x={x}
                                stroke="#000"
                                strokeOpacity={0}         // 선은 숨기고
                                ifOverflow="extendDomain"  // 끝이 경계면 도메인 확장
                            >
                                <Label value="temp" position="top" style={{ fontSize: 14 }} />
                            </ReferenceLine>
                        ))}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}
