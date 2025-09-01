import * as Cesium from "cesium";
import type { Cartesian3 } from "cesium";
import {getViewer} from "@/app/components/templates/cesium/viewer/getViewer";

function isConstPos(p?: Cesium.PositionProperty): p is Cesium.ConstantPositionProperty {
    return !!p && "setValue" in p;
}

export default async function upsertDrawMarkers(points: Cartesian3[]) {
    const viewer = await getViewer();

    // 1) 인덱스별 업서트
    const keepIds = new Set<string>();
    for (let i = 0; i < points.length; i++) {
        const id = `draw_marker_${i}`;
        keepIds.add(id);

        const pos = points[i];
        const ent = viewer.entities.getById(id);

        if (!ent) {
            // 새 마커 추가
            viewer.entities.add({
                id,
                position: new Cesium.ConstantPositionProperty(pos),
                point: {
                    pixelSize: 10,
                    color: Cesium.Color.RED,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
            });
        } else {
            // 기존 마커 위치 갱신
            const p = ent.position;
            if (isConstPos(p)) p.setValue(pos);
            else ent.position = new Cesium.ConstantPositionProperty(pos);
        }
    }

    // 2) 초과 마커 정리 (이번 호출에서 유지하지 않는 draw_marker_* 제거)
    const toRemove: Cesium.Entity[] = [];
    for (const e of viewer.entities.values) {
        if (e.id.startsWith("draw_marker_") && !keepIds.has(e.id)) {
            toRemove.push(e);
        }
    }
    toRemove.forEach((e) => viewer.entities.remove(e));

    viewer.scene.requestRender?.();
}
