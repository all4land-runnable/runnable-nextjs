import * as Cesium from "cesium";
import {setSidewalkDS} from "@/app/staticVariables";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";

/** 1) 앱 시작 시 한 번만 호출해서 미리 로드(숨김) */
export async function initSidewalkLayer() {
    const viewer = getViewer();

    Cesium.GeoJsonDataSource.load("/dataset/sidewalk.geojson", {
        stroke: Cesium.Color.HOTPINK,
        fill: Cesium.Color.PINK.withAlpha(0.4),
        strokeWidth: 3,
        markerSymbol: "?",
        clampToGround: true,
    }).then((sidewalkDS) => {
        setSidewalkDS(sidewalkDS);

        viewer.dataSources.add(sidewalkDS).then(()=>{
            // 처음엔 보이지 않게
            sidewalkDS.show = false;

            // requestRender 모드에서 즉시 반영
            viewer.scene.requestRender?.();
        })
    })
}