const fmt = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    hour12: true, // 12시간제 (AM/PM)
});

export function amPmFormat(date: number) {
    return fmt.format(date);
}