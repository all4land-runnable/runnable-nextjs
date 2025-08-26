/**
 * px → rem 변환 함수
 * @param px 변환할 픽셀 값
 * @param base 기본 폰트 크기(px), 기본 16px = 1rem
 */
export function pxToRem(px: number, base = 16): number {
    return px / base;
}

export function remToPx(rem: number, base = 16): number {
    return rem * base;
}
