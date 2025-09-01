import type { Viewer } from 'cesium'

type ViewerStore = {
    set: (v: Viewer | null) => void
    get: () => Viewer | null
    isAlive: (v: Viewer | null) => v is Viewer
    wait: (opts?: { timeoutMs?: number; intervalMs?: number }) => Promise<Viewer>
}

// 전역 보관 (HMR에서도 1회만 생성)
declare global {
    interface Window {
        __MapPrimeViewer__?: Viewer | null
    }
}

const isAlive = (v: Viewer | null): v is Viewer => !!v && !v.isDestroyed()

export const viewerStore: ViewerStore = {
    set(v) {
        window.__MapPrimeViewer__ = v
    },
    get() {
        const v = window.__MapPrimeViewer__ ?? null
        return isAlive(v) ? v : null
    },
    isAlive,
    wait({ timeoutMs = 4000, intervalMs = 50 } = {}) {
        return new Promise<Viewer>((resolve, reject) => {
            const t0 = Date.now()
            const tick = () => {
                const v = viewerStore.get()
                if (v) return resolve(v)
                if (Date.now() - t0 >= timeoutMs) return reject(new Error('viewerStore.wait timeout'))
                setTimeout(tick, intervalMs)
            }
            tick()
        })
    },
}
