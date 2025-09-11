'use client';
import styles from "./MapPrime3DViewer.module.css";
import { useEffect, useRef } from 'react';
import { Viewer } from 'cesium';
import { createCesium } from "@/app/components/organisms/cesium/createCesiumViewer";
import { extendMapPrime3D } from "@/app/components/organisms/cesium/extendMapPrime3D";
import * as Cesium from "cesium";
import {initSidewalkLayer} from "@/app/components/organisms/cesium/initSidewalkLayer";

Cesium.Ion.defaultAccessToken = process.env.NEXT_PUBLIC_CESIUM_TOKEN!;

export default function MapPrime3DViewer() {
    const ref = useRef<HTMLDivElement | null>(null);
    const viewerRef = useRef<Viewer | null>(null);

    useEffect(() => {
        if (!ref.current) return;

        const viewer = createCesium(ref.current);
        viewerRef.current = viewer;

        // viewer 파괴 여부를 내부에서 다시 확인하도록 extendMapPrime3D가 방어코드를 갖습니다.
        extendMapPrime3D(viewer, {
            terrain: 'https://mapprime.synology.me:15289/seoul/data/terrain/1m_v1.1/',
            tileset: 'https://mapprime.synology.me:15289/seoul/data/all_ktx2/tileset.json',
            imageries: [{
                "title": "Imagery",
                "credit": "Arcgis",
                "type": "TMS",
                "epsg": "EPSG:3857",
                "url": "https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                "format": "jpeg",
                "maximumLevel": 18,
                "current": true,
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

        initSidewalkLayer().then();
    }, []);

    return <div ref={ref} className={styles.cesium} />;
}
