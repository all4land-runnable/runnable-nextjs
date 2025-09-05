/**
 * X축 거리 범위를 생성하는 함수이다.
 * - 기본 간격은 500m이다.
 * - 0m부터 lastMeter까지 step 간격으로 생성
 * - lastMeter가 x축 간격의 배수가 아니어도 "마지막 틱"으로 반드시 포함
 *
 * 전제조건:
 * - minMeter ≤ lastMeter
 * - step > 0
 *
 * @param lastMeter 총 거리
 * @param step x축 단위
 */
export default function initXTick(lastMeter: number, step = 500): number[] {
    // 누적할 틱 배열
    const xTick: number[] = [];

    // 0부터 step 단위로, lastMeter 까지 추가
    for (let x = 0; x <= lastMeter; x += step)
        xTick.push(x);

    // x축 단위에 lastMeter를 포함 (만약 없다면 lastMeter 추가)
    if (xTick[xTick.length - 1] !== lastMeter) xTick.push(lastMeter);

    return xTick;
}