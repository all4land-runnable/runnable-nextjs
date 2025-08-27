const fmt = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    hour12: true, // 12시간제 (AM/PM)
});

/**
 * mm:ss AM/PM 자동 포매팅 함수
 * @param date 원하는 시각 TODO: 단위 변경 예정
 */
export function amPmFormat(date: number) {
    return fmt.format(date);
}