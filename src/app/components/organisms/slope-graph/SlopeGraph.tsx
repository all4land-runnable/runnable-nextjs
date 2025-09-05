'use client'

import {
    Area, ComposedChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip,
    ReferenceDot,
    Label
} from 'recharts';
import styles from './SlopeGraph.module.css'
import addSlope from "@/app/components/organisms/slope-graph/util/addSlope";
import initXTick from "@/app/components/organisms/slope-graph/util/initXTick";
import segmentBySlope from "@/app/components/organisms/slope-graph/util/segmentBySlope";
import formatKmTick from "@/app/components/organisms/slope-graph/util/formatKmTick";
import {formatKm} from "@/app/utils/claculator/formatKm";

// NOTE 1. 타입 지정
/**
 * 그래프에 들어갈 데이터를 모아둔 클래스이다.
 *
 * @param meter 진행 거리(x축 좌표)
 * @param height 고도(y축 좌표)
 * @param slope 기울기(색상)
 * @param pace 페이스 속도(라벨)
 */
export type SlopeDatum = {
    meter: number;
    height: number;
    slope: number;
    pace?: string;
}

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

/**
 * 실제 그래프 정보가 들어가는 함수
 *
 * @param slopeGraphParams 경사도 그래프 속성 정보
 * @constructor
 */
export default function SlopeGraph({ slopeGraphParams }: SlopeGraphProps) {
    // NOTE 2. Param을 기반으로 Datum을 생성한다. (단 Pace 정보는 undefined)
    const data: SlopeDatum[] = addSlope(slopeGraphParams); // 데이터에 slope(%) 추가

    // 자주 사용하는 데이터 추출
    const meters = data.map(d => d.meter)
    const heights = data.map(d => d.height);

    // 범위 계산 // TODO: 그래프의 범위를 조절하기 위해 만드는 것으로 추정된다.
    const meterFirst = Math.min(...meters);
    const meterLast  = Math.max(...meters);

     // 범위 계산 // TODO: 최고 최저 고도 측정을 위해 사용한다.
    const heightMin = Math.min(...heights);
    const heightMax = Math.max(...heights);

    // heightMin/Max가 있는 위치
    const minIdx = heights.indexOf(heightMin);
    const maxIdx = heights.indexOf(heightMax);

    // 각각의 meter
    const meterAtMin = data[minIdx]?.meter; // 최저점의 meter
    const meterAtMax = data[maxIdx]?.meter; // 최고점의 meter

    // TODO: 그래프의 범위를 조절하기 위해 만드는 것으로 추정된다.
    const Y_STEP = 5; // y축 단위(5m 단위로 표시된다.)
    const yDomainMin = Math.floor(heightMin / Y_STEP) * Y_STEP; // 바닥 범위
    const yDomainMax = Math.ceil(heightMax / Y_STEP) * Y_STEP; // 높이 범위

    const yTicks: number[] = []; // y축 틱 (5미터 단위)
    for (let v = yDomainMin; v <= yDomainMax; v += Y_STEP) yTicks.push(v);
    const xTicks = initXTick(meterLast, 500); // X축 틱 (500m + 총거리)

    // NOTE 3. 경사각 계산
    // 오르막 내리막 라인
    const { up, down } = segmentBySlope(data);

    // 커스텀 Tooltip (버전 독립 타입)
    type CustomTooltipProps = {
        active?: boolean;
        payload?: Array<{ payload: SlopeDatum }>;
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
                <div><strong>이동 거리</strong> : {formatKm(p.meter)}</div> {/* 이동 거리 */}
                <div><strong>고도</strong> : {formatKm(p.height)}</div> {/* 고도 */}
                <div><strong>경사도</strong> : {`${p.slope >= 0 ? '+' : ''}${p.slope.toFixed(1)}%`}</div> {/* 경사도 */}
            </div>
        );
    };

    return (
        <section>
            <div className={styles.slopeGraph}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        // width={remToPx(58.125)}
                        // height={remToPx(18.75)}
                        data={data}
                    >
                        <CartesianGrid strokeDasharray="5 5" />

                        <XAxis
                            dataKey="meter" // 데이터
                            type="number" // 타입
                            // domain={[meterFirst, meterLast]} // 범위
                            ticks={xTicks} // 라인
                            allowDecimals // 소수 허용
                            tickFormatter={(xTick: number) => formatKmTick(xTick, meterLast)} // tick에 표시될 정보
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
                            stroke="#FFFFFF"
                            fill="#FFFFFF"
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
                        {/* 최저점 마커 + 라벨 */}
                        <ReferenceDot x={meterAtMin} y={heightMin} r={4} fill="#1e63ff" stroke="#000">
                            <Label value={formatKm(heightMin)} position="bottom" style={{ fontSize: 14 }} />
                        </ReferenceDot>

                        {/* 최고점 마커 + 라벨 */}
                        <ReferenceDot x={meterAtMax} y={heightMax} r={4} fill="#ff4d4f" stroke="#000">
                            <Label value={formatKm(heightMax)} position="top" style={{ fontSize: 14 }} />
                        </ReferenceDot>
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}
