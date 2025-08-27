'use client'

import React from 'react'
import type {Viewer} from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import {CesiumType} from "@/app/types/cesium";
import {getMapPrimeExtension} from "@/app/components/templates/cesium/getMapPrimeExtension";

/**
 * 최소 구성의 Cesium + MapPrime
 * - Viewer 생성/파괴
 * - MapPrime3DExtension 적용(viewer.extend)
 * - Strict Mode/HMR에서 파괴된 viewer에 extend하지 않도록 방어 로직 포함
 */
export const CesiumComponent: React.FunctionComponent<{ CesiumJs: CesiumType }> = ({ CesiumJs }) => {
    const viewerRef = React.useRef<Viewer | null>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)

    // 현재 viewer가 살아있는지(파괴되지 않았는지) 확인
    const isAlive = (v: Viewer | null): v is Viewer => !!v && !v.isDestroyed()

    React.useEffect(() => {
        // 이미 생성되어 있거나 컨테이너가 없으면 중단
        if (viewerRef.current || !containerRef.current) return

        // Cesium 정적 리소스 경로 (public/cesium 가정)
        window.CESIUM_BASE_URL = '/cesium'
        // 일부 플러그인이 전역 Cesium을 기대하므로 바인딩
        window.Cesium = CesiumJs

        // Viewer 생성(최소)
        viewerRef.current = new CesiumJs.Viewer(containerRef.current)

        // 개발 모드 Strict/HMR 대비 플래그
        let disposed = false

        ;(async () => {
            try {
                const MapPrime = await getMapPrimeExtension()

                const v = viewerRef.current
                if (disposed || !isAlive(v)) return

                v.extend(MapPrime, {
                    terrain: process.env.NEXT_PUBLIC_SAMPLE_TERRAIN,
                    tileset: process.env.NEXT_PUBLIC_SAMPLE_TILESET,
                    controls: [],
                    imageries: [
                        {
                            title: 'Imagery',
                            credit: 'ArcGIS',
                            type: 'TMS',
                            epsg: 'EPSG:3857',
                            url: process.env.NEXT_PUBLIC_ARCGIS_TILESET_URL,
                            format: 'jpeg',
                            maximumLevel: 18,
                            current: false,
                        },
                        {
                            title: '일반',
                            credit: '바로e맵',
                            type: 'WTMS',
                            epsg: 'EPSG:5179',
                            url: process.env.NEXT_PUBLIC_BARO_TILESET_URL,
                            format: 'png',
                            maximumLevel: 19,
                            current: true,
                        },
                    ],
                    credit: '<i>MapPrime</i>',
                    initialCamera: {
                        longitude: 127.035,
                        latitude: 37.519,
                        height: 400,
                        heading: 340,
                        pitch: -50,
                        roll: 0,
                    },
                })
            } catch (err) {
                console.error('[MapPrime] 적용 실패:', err)
            }
        })()

        // 언마운트/HMR 시 정리
        return () => {
            disposed = true
            const v = viewerRef.current
            try {
                if (isAlive(v)) v.destroy()
            } finally {
                viewerRef.current = null
            }
        }
    }, [CesiumJs])

    return (
        <div
            ref={containerRef}
            id="cesium-container"
            style={{ height: '100vh', width: '100vw' }}
        />
    )
}

export default CesiumComponent
