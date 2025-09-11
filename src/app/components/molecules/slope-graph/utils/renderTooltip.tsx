// 1) 로컬 타입(버전 차이 안전)
import {formatKm} from "@/app/utils/claculator/formatKm";
import {GraphDatum} from "@/app/components/molecules/slope-graph/SlopeGraph";

const STEP_M = 25; // 25 m 재샘플링 간격
type RP<T> = { payload: T };
type TooltipContentProps<T> = {
    active?: boolean;
    payload?: RP<T>[];
    label?: unknown;
};

// 2) SlopeGraph 내부에 추가
export const renderTooltip = (props: TooltipContentProps<GraphDatum>) => {
    const { active, payload } = props;
    if (!active || !payload || payload.length === 0) return null;

    const d = payload[0].payload;               // 원본 datum
    const distance = formatKm(d.distance * STEP_M);
    const height = `${Math.round(d.height)}m`;  // 높이는 m로 고정 표기
    const slope = `${d.slope.toFixed(2)}%`;

    return (
        <div style={{
            background: 'rgba(255,255,255,0.95)',
                border: '1px solid #eee',
                borderRadius: 8,
                padding: '8px 10px',
                lineHeight: 1.4,
                fontSize: 12,
                color: '#333'
        }}>
            <div>거리: {distance}</div>
            <div>높이: {height}</div>
            <div>경사도: {slope}</div>
        </div>
    );
};
