export const formatSpeed = (label: string) => {
    const m = Number(label.replace(/[^0-9.]/g, ''));
    return Number.isFinite(m) ? m : 1;
};