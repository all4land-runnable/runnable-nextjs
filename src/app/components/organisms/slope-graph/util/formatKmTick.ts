/**
 * X축 라벨에 km 표기
 *
 * @param xTick x좌표 단위
 * @param lastMeter 총 거리
 */
export default function formatKmTick(xTick: number, lastMeter: number) {
    const km = xTick / 1000;

    // 총 거리일 때 소수 둘째자리 내림을 진행한다.
    if (xTick === lastMeter) {
        const floored = Math.floor(km * 100) / 100; // 소수 둘째 자리 내림
        return `${Number.isInteger(floored) ? floored.toFixed(0) : floored.toFixed(2)}km`;
    }
    if (xTick % 1000 === 0) return `${km.toFixed(0)}km`;
    return `${(Math.round(km * 10) / 10).toFixed(1)}km`;
}