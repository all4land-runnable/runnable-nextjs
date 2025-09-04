import * as Cesium from "cesium";
import type { Viewer, Cartesian3, Cartographic, JulianDate } from "cesium";

export type HeightSample = {
    lon: number;   // 경도(deg)
    lat: number;   // 위도(deg)
    height: number; // 지형고도(m)
    dist: number;   // 시작점부터 누적거리(m)
};

/**
 * NOTE 0. 개요
 * - 인자로 받은 Entity(Polyline)에서 현재 시간대의 좌표들을 뽑아낸 뒤,
 *   Viewer에 설정된 terrainProvider를 이용해 지형 고도를 샘플링한다.
 * - 결과는 경도/위도/고도/누적거리로 구성된 프로파일 배열.
 *
 * @param viewer  Cesium Viewer (현재 terrainProvider 보유)
 * @param entity  Polyline을 가진 Cesium.Entity (entity.polyline.positions 사용)
 * @param stepMeters  샘플링 간격(m). 값이 작을수록 촘촘(=정확)하지만 비용 증가 (기본 30m)
 */
export async function routeHeightFromEntity(
    viewer: Viewer,
    entity: Cesium.Entity,
    stepMeters = 30
): Promise<HeightSample[]> {

    // NOTE 1. 시간 스냅샷 확보
    // - Property 타입의 값은 시간에 따라 달라질 수 있으므로, 일관된 시점으로 평가
    const time: JulianDate = viewer.clock?.currentTime ?? Cesium.JulianDate.now();

    // NOTE 2. Polyline 존재 여부 확인
    const poly = entity.polyline;
    if (!poly) return []; // 폴리라인이 없다면 측정 불가

    // NOTE 3. positions(Property | Cartesian3[]) 안전 추출
    // - polyline.positions는 보통 Property 타입
    // - Array 그대로 오는 케이스도 있으므로 둘 다 처리
    const positionsProp = poly.positions as unknown;

    // getValue를 보유한 Property 판별 가드
    const isPosProperty = (
        x: unknown
    ): x is { getValue: (time?: JulianDate) => Cartesian3[] | undefined } => {
        return typeof x === "object" && x !== null && "getValue" in x &&
            typeof (x as { getValue: unknown }).getValue === "function";
    };

    let positions: Cartesian3[] | undefined;
    if (Array.isArray(positionsProp)) {
        positions = positionsProp as Cartesian3[];
    } else if (isPosProperty(positionsProp)) {
        positions = positionsProp.getValue(time);
    }

    // 유효성 체크
    if (!positions || positions.length < 2) return [];

    // NOTE 4. 경로를 지오데식으로 분할 (Cartographic)
    // - 각 세그먼트를 stepMeters 간격으로 나눠 샘플 포인트 생성
    // - 인접 세그먼트의 경계점 중복을 피하기 위해 i>0 && j===0 일 때는 스킵
    const samples: Cartographic[] = [];
    for (let i = 0; i + 1 < positions.length; i++) {
        const c0 = Cesium.Cartographic.fromCartesian(positions[i]);
        const c1 = Cesium.Cartographic.fromCartesian(positions[i + 1]);

        const geod = new Cesium.EllipsoidGeodesic(c0, c1);
        const segLen = geod.surfaceDistance;                   // 세그먼트 지표거리
        const n = Math.max(1, Math.ceil(segLen / stepMeters)); // 샘플 개수 결정

        for (let j = 0; j <= n; j++) {
            if (i > 0 && j === 0) continue; // 세그먼트 경계 중복 제거
            const f = j / n;                 // 0~1 구간 내 분할비
            const p = geod.interpolateUsingFraction(f);
            p.height = 0;                    // 이후 지형 샘플러가 채울 값
            samples.push(p);
        }
    }

    // NOTE 5. Terrain 고도 채우기
    // - viewer.terrainProvider가 Ellipsoid면(기본값) 결과 고도는 0일 수 있음
    const filled = await Cesium.sampleTerrainMostDetailed(
        viewer.terrainProvider,
        samples
    );

    // NOTE 6. 누적거리 계산 및 결과 구성
    const out: HeightSample[] = [];
    let prev: Cartographic | null = null;
    let cum = 0;

    for (const c of filled) {
        if (prev) {
            // 지면을 따라 누적거리 계산
            cum += new Cesium.EllipsoidGeodesic(prev, c).surfaceDistance;
        }

        out.push({
            lon: Cesium.Math.toDegrees(c.longitude),
            lat: Cesium.Math.toDegrees(c.latitude),
            height: c.height ?? 0,
            dist: cum,
        });

        prev = c;
    }

    return out;
}
