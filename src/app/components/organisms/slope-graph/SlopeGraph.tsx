'use client'

import {Area, ComposedChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, ReferenceLine, Label, Tooltip, LabelList} from 'recharts';
import styles from './SlopeGraph.module.css'
import { remToPx } from '@/app/utils/claculator/pxToRem';

/**
 * 누적거리와 고도 정보를 갖고 있는 클래스이다.
 */
export type SlopeGraphParam = {
    meter: number;
    height: number;
};

type SlopeGraphProps = {
    slopeGraphParams: SlopeGraphParam[];
};

// n을 step의 배수로 "내림"한 값을 반환
// 예) n=1234, step=500 → 1000
const floorToStep = (n: number, step: number) => Math.floor(n / step) * step;

// n을 step의 배수로 "올림"한 값을 반환
// 예) n=1234, step=500 → 1500
const ceilToStep  = (n: number, step: number) => Math.ceil(n / step) * step;

/**
 * X축 거리 범위를 생성하는 함수이다.
 * - 기본 간격은 500m이다.
 * - 0m부터 lastMeter까지 step 간격으로 생성
 * - lastMeter가 x축 간격의 배수가 아니어도 "마지막 틱"으로 반드시 포함
 *
 * 전제조건:
 * - minMeter ≤ lastMeter
 * - step > 0
 *
 * @param lastMeter 총 거리
 * @param step x축 단위
 */
function initXTick(lastMeter: number, step = 500): number[] {
    // 누적할 틱 배열
    const xTick: number[] = [];

    // 0부터 step 단위로, lastMeter 까지 추가
    for (let x = 0; x <= lastMeter; x += step)
        xTick.push(x);

    // x축 단위에 lastMeter를 포함 (만약 없다면 lastMeter 추가)
    if (xTick[xTick.length - 1] !== lastMeter) xTick.push(lastMeter);

    return xTick;
}


/**
 * SlopeGraphParam에 경사도를 추가한 클래스
 */
type Datum = SlopeGraphParam & { slope: number };

/**
 * 객체에 경사도를 추가하는 함수이다.
 *
 * @param slopeGraphParams 경사도가 추가될 객체
 */
function addSlope(slopeGraphParams: SlopeGraphParam[]): Datum[] {
    return slopeGraphParams.map((slopeGraphParam, index) => {
        if (index === 0)
            return { ...slopeGraphParam, slope: 0 }; // 첫 인덱스의 경사도는 0

        // 경사도 연산
        const dx = slopeGraphParam.meter - slopeGraphParams[index - 1].meter; // 거리 델타
        const dz = slopeGraphParam.height - slopeGraphParams[index - 1].height; // 높이 델타
        const slope = dx !== 0 ? (dz / dx) * 100 : 0; // 경사도

        return { ...slopeGraphParam, slope };
    });
}

// 상승/하강 분리용
type PlotPoint = { meter: number; height: number | null };

/**
 * 기울기 부호를 통해 색상을 분리하는 함수이다.
 * 추가로 섹션 중앙 x 좌표를 계산한다. TODO: x좌표 계산안하고 Label 지정해도 될듯
 *
 * @param slopeGraphParams 사용될 경사도 정보들(오르막 그래프, 내리막 그래프, 중앙 그래프)
 */
function segmentBySlope(slopeGraphParams: SlopeGraphParam[]) {
    const slopeGraphParamsLength = slopeGraphParams.length;

    // 객체 얕은 복사
    // Null로 그리면 해당 x축에 그래프가 안그려진다.
    const up: PlotPoint[] = slopeGraphParams.map(slopeGraphParam => ({ meter: slopeGraphParam.meter, height: null }));
    const down: PlotPoint[] = slopeGraphParams.map(slopeGraphParam => ({ meter: slopeGraphParam.meter, height: null }));

    // 사인값으로 경사도 계산
    const sign = (x: number) => (x > 0 ? 1 : x < 0 ? -1 : 0);


    // 오르막과 내리막을 계산한다.
    const slopes: number[] = [];
    for (let i = 0; i < slopeGraphParamsLength - 1; i++) {
        // 높이 델타 값
        const dh = slopeGraphParams[i + 1].height - slopeGraphParams[i].height;

        // 사인 코사인 연산 (그냥 경사도 측정)
        slopes[i] = sign(dh);

        if (slopes[i] > 0) { // 오르막이면,
            up[i].height = slopeGraphParams[i].height;
            up[i + 1].height = slopeGraphParams[i + 1].height;
        } else if (slopes[i] < 0) { // 내리막이면,
            down[i].height = slopeGraphParams[i].height;
            down[i + 1].height = slopeGraphParams[i + 1].height;
        }
    }

    // 경사도를 기반으로 구간을 구분한다.
    const boundaries: number[] = [0];
    for (let i = 1; i < slopes.length; i++)
        // slope에는 오르막 내리막 적보다 1, -1로 저장되어 있으므로, 단위가 바뀐다면 구간이 끝났음을 의미한다.
        if (slopes[i] !== slopes[i - 1])
            boundaries.push(i); // 한 구간의 시작 인덱스를 저장한다.

    boundaries.push(slopeGraphParamsLength - 1);

    // 중앙 인덱스를 계산한다.
    const sectionCenters: number[] = [];
    for (let i = 0; i < boundaries.length - 1; i++) {
        const sectionStartIndex = boundaries[i];
        const sectionEndIndex = boundaries[i + 1];
        sectionCenters.push((slopeGraphParams[sectionStartIndex].meter + slopeGraphParams[sectionEndIndex].meter) / 2);
    }
    return { up, down, sectionCenters };
}

/**
 * X축 라벨에 km 표기
 *
 * @param xTick x좌표 단위
 * @param lastMeter 총 거리
 */
function formatKmTick(xTick: number, lastMeter: number) {
    const km = xTick / 1000;

    // 총 거리일 때 소수 둘째자리 내림을 진행한다.
    if (xTick === lastMeter) {
        const floored = Math.floor(km * 100) / 100; // 소수 둘째 자리 내림
        return `${Number.isInteger(floored) ? floored.toFixed(0) : floored.toFixed(2)}km`;
    }
    if (xTick % 1000 === 0) return `${km.toFixed(0)}km`;
    return `${(Math.round(km * 10) / 10).toFixed(1)}km`;
}

// 단위 표기 포맷
const formatMeters = (meter: number) => `${meter.toLocaleString()} m`;
const formatSlopePercent = (percent: number) => `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`;

/* ------------------------- 추가: 섹션 중앙 라벨(pace) 유틸 ------------------------- */
// 라벨 선택 규칙: 섹션 중앙 meter에 가장 가까운 데이터 인덱스에만 pace 문자열(예: 'temp')을 부여하고, 나머지는 null.
type LabeledDatum = Datum & { pace: string | null };

// 이진/선형 탐색 중 간단히 선형으로 최근접 인덱스 선택 (데이터 길이가 크면 이진탐색로 교체 가능)
function nearestIndexByMeter(data: Datum[], target: number): number {
    let best = 0;
    let bestDiff = Number.POSITIVE_INFINITY;
    for (let i = 0; i < data.length; i++) {
        const diff = Math.abs(data[i].meter - target);
        if (diff < bestDiff) { best = i; bestDiff = diff; }
    }
    return best;
}

function attachPaceLabels(data: Datum[], centers: number[], makeLabel: (m:number)=>string = ()=>'temp'): LabeledDatum[] {
    const out: LabeledDatum[] = data.map(d => ({ ...d, pace: null }));
    const used = new Set<number>();
    for (const c of centers) {
        const idx = nearestIndexByMeter(data, c);
        if (used.has(idx)) continue;         // 동일 인덱스 중복 방지
        used.add(idx);
        out[idx].pace = makeLabel(data[idx].meter);
    }
    return out;
}
/* ------------------------------------------------------------------------- */

/**
 * 실제 그래프 정보가 들어가는 함수
 * @param slopeGraphParams 경사도 그래프 속성 정보
 * @constructor
 */
export default function SlopeGraph({ slopeGraphParams }: SlopeGraphProps) {
    const base: SlopeGraphParam[] = slopeGraphParams.length
        ? slopeGraphParams
        : [{ meter: 0, height: 0 }, { meter: 1000, height: 0 }];

    // 데이터에 slope(%) 추가
    const data: Datum[] = addSlope(base);

    // 범위 계산
    const meterFirst = Math.min(...data.map(d => d.meter));
    const meterLast  = Math.max(...data.map(d => d.meter));

    const heights = data.map(d => d.height);
    const heightMin = Math.min(...heights);
    const heightMax = Math.max(...heights);

    const Y_STEP = 5;
    const yDomainMin = floorToStep(heightMin, Y_STEP); // 바닥 범위
    const yDomainMax = ceilToStep(heightMax, Y_STEP); // 높이 범위
    const yTicks: number[] = []; // y축 단위
    for (let v = yDomainMin; v <= yDomainMax; v += Y_STEP) yTicks.push(v);

    // X축 틱 (500m + 총거리)
    const xTicks = initXTick(meterLast, 500);

    // 상승/하강 라인 & 섹션 중앙
    const { up, down, sectionCenters } = segmentBySlope(data);

    // 커스텀 Tooltip (버전 독립 타입)
    type CustomTooltipProps = {
        active?: boolean;
        payload?: Array<{ payload: Datum }>;
    };

    const SlopeTooltip = ({ active, payload }: CustomTooltipProps) => {
        if (!active || !payload || payload.length === 0) return null;

        // payload 중 slope 필드를 가진 Datum 찾기 (Area 시리즈에 해당)
        const item = payload.find(e => typeof e.payload.slope === 'number');
        if (!item) return null;

        const p = item.payload; // p: Datum (meter, height, slope 모두 보장)

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
                <div><strong>경사도</strong> : {formatSlopePercent(p.slope)}</div>
            </div>
        );
    };

    // 추가: 섹션 중앙 라벨을 위해 데이터에 pace 필드 부여 (라벨 텍스트는 현재 'temp')
    const dataWithPace: LabeledDatum[] = attachPaceLabels(data, sectionCenters, () => 'temp');

    // (중복 라벨 방지) 기존 ReferenceLine 라벨 출력 여부 토글
    const ENABLE_REFERENCE_LABELS = false;

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
                            domain={[meterFirst, meterLast]}
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

                        {/* 툴팁: 거리, 고도, 경사도 */}
                        <Tooltip content={SlopeTooltip} cursor={{ strokeDasharray: '3 3' }} />

                        {/* 면 */}
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

                        {/* 추가: LabelList를 Line에 부착하여 섹션 중앙 라벨(pace) 표시 */}
                        <Line
                            type="monotone"
                            data={dataWithPace}
                            dataKey="height"
                            strokeOpacity={0}
                            dot={false}
                            isAnimationActive={false}
                        >
                            <LabelList dataKey="pace" position="top" style={{ fontSize: 14 }} />
                        </Line>

                        {/* 섹션 중앙 라벨 */}
                        {ENABLE_REFERENCE_LABELS && sectionCenters.map((x, i) => (
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
