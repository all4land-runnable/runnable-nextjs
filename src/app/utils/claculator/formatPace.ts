export function formatPace(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds <= 0) return "-";
    const total = Math.round(seconds);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m.toString().padStart(2, "0")}'${s.toString().padStart(2, "0")}''`;
}
