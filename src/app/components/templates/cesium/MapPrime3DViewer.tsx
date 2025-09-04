'use client';
import { useEffect, useRef } from 'react';
import { Viewer } from 'cesium';
import { createCesium, destroyCesium, enableAutoResize } from "@/app/components/templates/cesium/createCesiumViewer";
import styles from "@/app/page.module.css";
import { extendMapPrime3D } from "@/app/components/templates/cesium/extendMapPrime3D";

export default function MapPrime3DViewer() {
    const ref = useRef<HTMLDivElement | null>(null);
    const viewerRef = useRef<Viewer | null>(null);

    useEffect(() => {
        if (!ref.current) return;

        const viewer = createCesium(ref.current);
        viewerRef.current = viewer;

        // rAF / setTimeout id 저장
        let rafId: number | null = null;
        let timeoutId: number | null = null;
        let isAlive = true;

        rafId = requestAnimationFrame(() => {
            if (!viewer.isDestroyed()) viewer.resize();
        });

        timeoutId = window.setTimeout(() => {
            if (!viewer.isDestroyed()) viewer.resize();
        }, 200);

        const detachResize = enableAutoResize(viewer, ref.current);

        // extend 로딩이 늦어지는 동안 컴포넌트가 사라질 수 있으므로,
        // viewer 파괴 여부를 내부에서 다시 확인하도록 extendMapPrime3D가 방어코드를 갖습니다.
        extendMapPrime3D(viewer, {
            terrain: 'https://mapprime.synology.me:15289/seoul/data/terrain/1m_v1.1/',
            tileset: 'https://mapprime.synology.me:15289/seoul/data/all_ktx2/tileset.json',
            imageries: [{
                title: "seoul",
                credit: "seoul",
                type: "TMS",
                epsg: "EPSG:3857",
                url: "https://mapprime.synology.me:15289/MapPrimeServer/map/wmts?LAYER=mapprime:ecw_12cm&STYLE=&TILEMATRIXSET=google_tms&SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&FORMAT=image/png&TILEMATRIX={z}&TILECOL={x}&TILEROW={y}",
                format: "png",
                maximumLevel: 18,
                current: true,
            }],
            initialCamera: {
                longitude: 127.035,
                latitude: 37.519,
                height: 400,
                heading: 340,
                pitch: -50,
                roll: 0,
            },
        }).catch(console.error);

        return () => {
            isAlive = false;

            detachResize();

            // 3) Viewer 안전 파괴 (렌더 루프 stop → resize 무력화 → destroy)
            // destroyCesium(viewerRef.current ?? undefined);
            viewerRef.current = null;
        };
    }, []);

    return <div ref={ref} className={styles.cesium} />;
}
