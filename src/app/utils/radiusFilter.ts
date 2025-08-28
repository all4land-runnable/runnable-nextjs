/**
 * 특정 반경에 있는 데이터만 조회하기 위한 필터링 함수
 *
 * @param objects 위치 데이터를 가진 배열
 * @param cameraLat 기준 위도
 * @param cameraLon 기준 경도
 * @param RADIUS 반경 (m)
 */
const EARTH_RADIUS_M = 6371000; // meters
const DEG2RAD = Math.PI / 180;

export default function radiusFilter<T extends { lat: string; lng: string }>(
    objects: T[],
    cameraLat: number,
    cameraLon: number,
    RADIUS: number = 500
): T[] {
    // 기본 가드
    if (!Array.isArray(objects) || objects.length === 0) return [];

    const camLatRad = cameraLat * DEG2RAD;
    const cosCamLat = Math.cos(camLatRad);
    const camLonRad = cameraLon * DEG2RAD;

    return objects.filter((object) => {
        const latNum = Number(object.lat);
        const lonNum = Number(object.lng);
        if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) return false;

        const latRad = latNum * DEG2RAD;
        const lonRad = lonNum * DEG2RAD;

        const dLat = latRad - camLatRad;
        const dLon = lonRad - camLonRad;

        const a =
            Math.sin(dLat / 2) ** 2 +
            cosCamLat * Math.cos(latRad) * Math.sin(dLon / 2) ** 2;

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = EARTH_RADIUS_M * c;

        return distance <= RADIUS;
    });
}
