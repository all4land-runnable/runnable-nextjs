// drawerStore.ts
import Drawer from "@cesium-extends/drawer";
import {getViewer} from "@/app/components/templates/cesium/viewer/getViewer";

type DrawerStore = {
    set: (d: Drawer | null) => void;
    get: () => Drawer | null;
    isAlive: (d: Drawer | null) => d is Drawer;
    wait: (opts?: { timeoutMs?: number; intervalMs?: number }) => Promise<Drawer>;
};

// 전역 보관 (HMR에서도 1회만 생성)
declare global {
    interface Window {
        __MapPrimeDrawer__?: Drawer | null;
    }
}

const isAlive = (d: Drawer | null): d is Drawer => {
    // Drawer 자체에 isDestroyed가 없으므로, 연결된 viewer가 살아있는지만 보장
    const v = getViewer();
    return !!d && !!v;
};

export const drawerStore: DrawerStore = {
    set(d) {
        window.__MapPrimeDrawer__ = d ?? null;
    },
    get() {
        const d = window.__MapPrimeDrawer__ ?? null;
        return isAlive(d) ? d : null;
    },
    isAlive,
    wait({ timeoutMs = 4000, intervalMs = 50 } = {}) {
        return new Promise<Drawer>((resolve, reject) => {
            const t0 = Date.now();
            const tick = () => {
                const d = drawerStore.get();
                if (d) return resolve(d);
                if (Date.now() - t0 >= timeoutMs) return reject(new Error("drawerStore.wait timeout"));
                setTimeout(tick, intervalMs);
            };
            tick();
        });
    },
};
