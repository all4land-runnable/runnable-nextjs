import type { CesiumType } from '../types/cesium'
import type { Viewer } from 'cesium'

// ===== 전역 타입 선언: 필요한 최소만 =====
declare global {
    interface Window {
        CESIUM_BASE_URL?: string
        Cesium?: CesiumType
        MapPrime3DExtension?: MapPrimeExtFn
    }
}

// MapPrime 확장 함수: 옵션은 포괄 타입으로 최소화
export type MapPrimeExtFn = (viewer: Viewer, options: Record<string, unknown>) => void

// ===== 유틸(중복 로드 방지 + 폴링) — 최소 구현 =====
const MAPPRIME_SCRIPT_ID = 'mapprime-cesium-controls-script'

// 전역 심볼이 뜰 때까지 간단 폴링
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

// MapPrime3DExtension 확보(이미 있으면 즉시, 없으면 스크립트 로드)
export const ensureMapPrime = async (): Promise<MapPrimeExtFn> => {
    if (typeof window !== 'undefined' && window.MapPrime3DExtension) {
        return window.MapPrime3DExtension
    }

    let script = document.querySelector<HTMLScriptElement>(`#${MAPPRIME_SCRIPT_ID}`)
    if (!script) {
        script = document.createElement('script')
        script.id = MAPPRIME_SCRIPT_ID
        script.async = true
        script.src = '/mapprime.cesium-controls.min.js' // public 경로
        document.head.appendChild(script)
        await new Promise<void>((res, rej) => {
            script!.addEventListener('load', () => res(), { once: true })
            script!.addEventListener('error', () => rej(new Error('failed to load mapprime script')), { once: true })
        })
    }

    // 전역 심볼 등장까지 대기
    return waitFor<MapPrimeExtFn>(() => window.MapPrime3DExtension ?? null)
}