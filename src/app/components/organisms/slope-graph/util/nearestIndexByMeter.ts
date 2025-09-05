// 이진/선형 탐색 중 간단히 선형으로 최근접 인덱스 선택 (데이터 길이가 크면 이진탐색로 교체 가능)
import {SlopeDatum} from "@/app/components/organisms/slope-graph/SlopeGraph";

export default function nearestIndexByMeter(data: SlopeDatum[], target: number): number {
    let best = 0;
    let bestDiff = Number.POSITIVE_INFINITY;
    for (let i = 0; i < data.length; i++) {
        const diff = Math.abs(data[i].meter - target);
        if (diff < bestDiff) { best = i; bestDiff = diff; }
    }
    return best;
}