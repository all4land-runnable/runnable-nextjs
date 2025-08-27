/**
 * px 값을 rem 단위로 변경하는 함수
 * @param px 변환할 pixel 값
 * @param base 기본 폰트 크기(px), 기본 16px = 1rem
 */
export function pxToRem(px: number, base = 16): number {
    return px / base;
}

/**
 * rem 값을 px 단위로 변경하는 함수
 * @param rem 변환할 rem 값
 * @param base 기본 폰트 크기(px), 기본 16px = 1rem
 */
export function remToPx(rem: number, base = 16): number {
    return rem * base;
}
