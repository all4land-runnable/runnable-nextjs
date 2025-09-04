import type { Viewer } from "cesium";

declare global {
    interface Window {
        MapPrime3DExtension?: Viewer.ViewerMixin;
    }
}

export async function loadMapPrimeSdk(scriptPath = "/mapprime.cesium-controls.min.js"): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        if (window.MapPrime3DExtension) return resolve();

        const existing = document.querySelector<HTMLScriptElement>('script[data-mapprime-sdk="1"]');
        if (existing) {
            waitForExtension().then(resolve).catch(reject);
            return;
        }
        const s = document.createElement("script");
        s.src = scriptPath; s.async = true; s.defer = true;
        s.dataset.mapprimeSdk = "1";
        s.onload = () => { waitForExtension().then(resolve).catch(reject); };
        s.onerror = () => reject(new Error(`Failed to load MapPrime SDK: ${scriptPath}`));
        document.body.appendChild(s);
    });
}

export function waitForExtension(maxMs = 5000, stepMs = 100): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const maxTries = Math.ceil(maxMs / stepMs);
        let tries = 0;
        const tick = () => {
            tries++;
            if (window.MapPrime3DExtension) return resolve();
            if (tries >= maxTries) return reject(new Error("MapPrime3DExtension not available"));
            setTimeout(tick, stepMs);
        };
        tick();
    });
}

export interface MapPrimeInitialCamera {
    longitude: number; latitude: number; height: number;
    heading?: number; pitch?: number; roll?: number;
}
export interface MapPrimeImagery {
    title: string; url: string; credit?: string;
    type?: "TMS"|"WMTS"|"WMS"; epsg?: string; format?: string;
    maximumLevel?: number; current?: boolean;
}
export interface MapPrimeOptions {
    terrain?: string; tileset?: string; controls?: unknown[];
    credit?: string; imageries?: MapPrimeImagery[]; initialCamera?: MapPrimeInitialCamera;
}

export async function extendMapPrime3D(viewer: Viewer, options: MapPrimeOptions, sdkPath = "/mapprime.cesium-controls.min.js"): Promise<void> {
    // 이미 파괴된 경우 바로 종료
    if (viewer.isDestroyed()) return;

    if (!window.MapPrime3DExtension) {
        await loadMapPrimeSdk(sdkPath);
    }
    // 대기 중 컴포넌트가 사라진 경우 방어
    if (viewer.isDestroyed() || !window.MapPrime3DExtension) return;

    viewer.extend(window.MapPrime3DExtension, options);
}

export const isMapPrimeLoaded = () => !!window.MapPrime3DExtension;
