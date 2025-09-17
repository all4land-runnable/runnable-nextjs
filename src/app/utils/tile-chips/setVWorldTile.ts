import * as Cesium from "cesium";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";

const layerHandlers = {
    vworld: new Cesium.ImageryLayer(
        new Cesium.UrlTemplateImageryProvider({
            url: `https://api.vworld.kr/req/wmts/1.0.0/${process.env.NEXT_PUBLIC_VWORLD_ACCESS_KEY}/Base/{z}/{y}/{x}.png`,
        })
    ),
} as const;

type LayerName = keyof typeof layerHandlers;

function isValidLayerName(name: string): name is LayerName {
    return Object.prototype.hasOwnProperty.call(layerHandlers, name);
}

export function setLayer(layerName: string, open: boolean) {
    if (!isValidLayerName(layerName)) {
        console.warn(`[setLayer] Unknown layer: ${layerName}`);
        return;
    }

    const viewer = getViewer();
    const collection = viewer.imageryLayers;
    const layer = layerHandlers[layerName];

    const idx = collection.indexOf(layer);

    if (open) {
        // 컬렉션에 있으면 제거(두 번째 인자=false: destroy 안 함 → 재사용 가능)
        if (idx !== -1) collection.remove(layer, false);
    } else {
        // 이미 추가되어 있지 않으면 추가
        if (idx === -1) collection.add(layer);
        else layer.show = true; // 이미 있다면 show만 보장
    }
}
