import { useEffect, useState } from 'react'
import type { Viewer } from 'cesium'
import { viewerStore } from './viewerStore'

/**
 * 전역 Viewer를 쉽게 가져오기 위한 훅 인터페이스
 * - 즉시 사용 가능한 경우 즉시 반환
 * - 아직 없으면 나타날 때까지(타임아웃 없이) 대기 후 상태 반영
 */
export const useViewer = () => {
    const [viewer, setViewer] = useState<Viewer | null>(viewerStore.get())

    useEffect(() => {
        const current = viewerStore.get()
        if (current) {
            setViewer(current)
            return
        }
        let cancelled = false
        viewerStore.wait({ timeoutMs: 0 }) // 0 => 무기한 대기
            .then(v => { if (!cancelled) setViewer(v) })
            .catch(() => {}) // 필요시 에러 처리
        return () => { cancelled = true }
    }, [])

    return viewer
}
