import type { CesiumType } from '../types/cesium'
import type { Viewer } from 'cesium'

// ===== 전역 타입 선언: 필요한 최소만 =====
declare global {
    interface Window {
        CESIUM_BASE_URL?: string
        Cesium?: CesiumType
        MapPrime3DExtension?: MapPrimeExtension
    }
}

// MapPrime 확장 함수
export type MapPrimeExtension = (viewer: Viewer, options: Record<string, unknown>) => void

// MapPrime3DExtension 싱글톤
export const getMapPrimeExtension = async (): Promise<MapPrimeExtension> => {
    // NOTE 1. 맵프라임이 이미 있다면, 맵프라임 반환
    if (typeof window !== 'undefined' && window.MapPrime3DExtension) {
        return window.MapPrime3DExtension
    }

    // NOTE 2. public.mapprime.cesium-controls.min.js 동적 생성
    let script = document.querySelector<HTMLScriptElement>("#mapprime-cesium-controls-script")
    if (!script) {
        script = document.createElement('script')
        script.id = 'mapprime-cesium-controls-script'
        script.async = true
        script.src = '/mapprime.cesium-controls.min.js' // public 경로

        // NOTE 3. HTML head에 JS 추가
        document.head.appendChild(script)
        await new Promise<void>((res, rej) => {
            script!.addEventListener('load', () => res(), { once: true })
            script!.addEventListener('error', () => rej(new Error('failed to load mapprime script')), { once: true })
        })
    }

    // NOTE 4. 전역 심볼 등장까지 대기
    return waitFor<MapPrimeExtension>(() => window.MapPrime3DExtension ?? null)
}

/**
 * 전역 심볼이 뜰 때까지 간단 대기하는 함수
 * @param getter
 * @param timeoutMs
 * @param intervalMs
 */
const waitFor = <T,>(getter: () => T | null, timeoutMs = 2000, intervalMs = 50): Promise<T> =>
    new Promise((resolve, reject) => {
        const t0 = Date.now()
        const tick = () => {
            const v = getter()
            if (v) return resolve(v)
            if (Date.now() - t0 >= timeoutMs) return reject(new Error('waitFor timeout'))
            setTimeout(tick, intervalMs)
        }
        tick()
    })