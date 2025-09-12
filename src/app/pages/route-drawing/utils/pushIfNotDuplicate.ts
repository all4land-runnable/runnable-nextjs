export const EPS = 1e-12;
export const isFiniteNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export function pushIfNotDuplicate(acc: [number, number][], c: [number, number]) {
    if (acc.length === 0) { acc.push(c); return; }
    const [plng, plat] = acc[acc.length - 1];
    const [clng, clat] = c;
    if (Math.abs(plng - clng) > EPS || Math.abs(plat - clat) > EPS) acc.push(c);
}

export const toRad = (deg: number) => (deg * Math.PI) / 180;