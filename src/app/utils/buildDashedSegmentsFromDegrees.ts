import Cesium from "cesium";

const DASH_LEN_M = 3;  // 대시(흰 줄) 길이(미터) - 필요에 따라 조절
const GAP_LEN_M  = 2;  // 대시 사이 간격(미터) - 필요에 따라 조절

/**
 * [lon,lat,lon,lat,...] 형태의 경/위도 배열을 입력받아,
 * 타원체 지표면 지오데식 거리(=EllipsoidGeodesic.surfaceDistance)를 기준으로
 * '대시-갭' 패턴으로 잘린 선분 세트를 생성한다.
 *
 * @param degArray  경도/위도가 번갈아 담긴 배열 [lon,lat,lon,lat,...]
 * @param dashLen   대시(그려지는 구간) 길이(미터)
 * @param gapLen    갭(비워두는 구간) 길이(미터)
 * @returns         각 대시 구간을 [lon,lat,lon,lat]로 가진 배열들의 리스트
 *
 * 주의:
 * - clampToGround=true 인 폴리라인에 기본 점선 재질이 잘 적용되지 않는 경우가 있어,
 *   실제 점선처럼 보이도록 '여러 짧은 선분'을 직접 생성하는 방식이다.
 * - dashLen/gapLen 을 너무 작게 하면 세그먼트 수가 급증하여 성능에 영향이 있을 수 있다.
 * - 입력 좌표는 WGS84(경도/위도, degrees) 기준이며, fromDegrees 사용 시 [경도,위도] 순서를 준수한다.
 */
export default function buildDashedSegmentsFromDegrees(
    degArray: number[],
    dashLen: number = DASH_LEN_M,
    gapLen: number = GAP_LEN_M
): number[][] {
    const segments: number[][] = [];

    // 인접한 점 쌍([i,i+1] -> [i+2,i+3])을 하나의 '원본 선분'으로 보고 순회
    for (let i = 0; i < degArray.length - 2; i += 2) {
        // 원본 선분의 시작/끝 경위도
        const startLon = degArray[i];
        const startLat = degArray[i + 1];
        const endLon   = degArray[i + 2];
        const endLat   = degArray[i + 3];

        // 경위도를 Cartographic으로 변환
        const start = Cesium.Cartographic.fromDegrees(startLon, startLat);
        const end   = Cesium.Cartographic.fromDegrees(endLon,   endLat);

        // 타원체 지오데식(최단거리) 경로 객체
        const geod  = new Cesium.EllipsoidGeodesic(start, end);

        // 해당 선분의 지표면 거리(미터)
        const total = geod.surfaceDistance;
        if (!Number.isFinite(total) || total <= 0) continue; // 길이가 0 또는 비정상이면 스킵

        // '대시-갭' 패턴으로 [s, e] 구간들을 생성
        // s 는 선분 시작점으로부터의 거리, e 는 대시의 끝 지점까지의 거리
        for (let s = 0; s < total; s += (dashLen + gapLen)) {
            const e  = Math.min(s + dashLen, total); // 마지막 대시는 선분 끝을 넘지 않도록 보정
            const f1 = s / total; // 0~1 사이 비율 (시작)
            const f2 = e / total; // 0~1 사이 비율 (끝)

            // 비율(fraction) 기반 선형 보간으로 대시 구간의 양 끝점 좌표 계산
            const c1 = geod.interpolateUsingFraction(f1);
            const c2 = geod.interpolateUsingFraction(f2);

            // [lon,lat,lon,lat] 형태로 세그먼트 저장 (degrees 단위로 변환)
            segments.push([
                Cesium.Math.toDegrees(c1.longitude),
                Cesium.Math.toDegrees(c1.latitude),
                Cesium.Math.toDegrees(c2.longitude),
                Cesium.Math.toDegrees(c2.latitude),
            ]);
        }
    }

    return segments;
}
