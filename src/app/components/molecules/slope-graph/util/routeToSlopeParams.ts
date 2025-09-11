// src/app/components/molecules/slope-graph/util/routeToSlopeParams.ts
import type { Route } from "@/type/route";

export type SlopeGraphParam = { meter: number; height: number };

export default function routeToSlopeParams(route?: Route): SlopeGraphParam[] {
    if (!route?.sections?.length) return [];

    // 섹션 → 포인트 평탄화
    const flat = route.sections.flatMap(s =>
        s.points.map(p => ({
            meter: Number.isFinite(p.distance) ? p.distance : 0,
            height: Number.isFinite(p.height) ? p.height : 0,
        }))
    );

    // 거리 오름차순
    flat.sort((a, b) => a.meter - b.meter);

    // 인접 중복 meter 정리(같은 지점이 여러 번 들어온 경우 마지막 값 유지)
    const out: SlopeGraphParam[] = [];
    const EPS = 1e-6;
    for (const d of flat) {
        const prev = out[out.length - 1];
        if (prev && Math.abs(prev.meter - d.meter) < EPS) {
            out[out.length - 1] = d; // 덮어쓰기
        } else {
            out.push(d);
        }
    }
    return out;
}
