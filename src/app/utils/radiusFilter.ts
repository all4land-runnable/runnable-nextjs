/**
 * 특정 반경에 있는 데이터만 조회하기 위한 필터링 함수
 *
 * @param objects 위치 데이터를 가진 배열
 * @param cameraLat 기준 위도
 * @param cameraLon 기준 경도
 * @param RADIUS 반경 (m)
 */
export default function radiusFilter<T extends { lat: string; lng: string }>(
    objects: T[],
    cameraLat: number,
    cameraLon: number,
    RADIUS: number = 500
): T[] {
    return objects.filter(object => {
        const latNum = Number(object.lat);
        const lonNum = Number(object.lng);

        const dLat = (latNum - cameraLat) * Math.PI / 180;
        const dLon = (lonNum - cameraLon) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(cameraLat * Math.PI / 180) *
            Math.cos(latNum * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = 6371000 * c;
        return distance <= RADIUS;
    });
}
