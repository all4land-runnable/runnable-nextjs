import {SlopeDatum} from "@/app/components/molecules/slope-graph/SlopeGraph";
import nearestIndexByMeter from "@/app/components/molecules/slope-graph/util/nearestIndexByMeter";

export default function attachPaceLabels(data: SlopeDatum[], centers: number[], makeLabel: (m:number)=>string = ()=>'temp'): SlopeDatum[] {
    const out: SlopeDatum[] = data.map(d => ({ ...d, pace: undefined }));
    const used = new Set<number>();
    for (const c of centers) {
        const idx = nearestIndexByMeter(data, c);
        if (used.has(idx)) continue;         // 동일 인덱스 중복 방지
        used.add(idx);
        out[idx].pace = makeLabel(data[idx].meter);
    }
    return out;
}