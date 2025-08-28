import * as Cesium from "cesium";
import {getViewer} from "@/app/components/templates/cesium/getViewer";

export let sidewalkDS: Cesium.GeoJsonDataSource | null = null;

/** 1) 앱 시작 시 한 번만 호출해서 미리 로드(숨김) */
export async function initSidewalkLayer() {
    const viewer = await getViewer();
    if (sidewalkDS) return;

    sidewalkDS = await Cesium.GeoJsonDataSource.load("/dataset/sidewalk.geojson", {
        stroke: Cesium.Color.HOTPINK,
        fill: Cesium.Color.PINK.withAlpha(0.4),
        strokeWidth: 3,
        markerSymbol: "?",
        clampToGround: true,
    });

    sidewalkDS.name = "sidewalk";

    await viewer.dataSources.add(sidewalkDS);

    // 처음엔 보이지 않게
    sidewalkDS.show = false;

    // (선택) requestRender 모드에서 즉시 반영
    viewer.scene.requestRender?.();
}