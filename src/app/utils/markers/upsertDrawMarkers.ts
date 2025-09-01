import * as Cesium from "cesium";
import type { Cartesian3 } from "cesium";

function isConstPos(p?: Cesium.PositionProperty): p is Cesium.ConstantPositionProperty {
    return !!p && "setValue" in p;
}

function setTailLabel(entity: Cesium.Entity, text: string) {
    const lg =
        entity.label ??
        new Cesium.LabelGraphics({
            font: "14px sans-serif",
            fillColor: Cesium.Color.BLACK,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.TOP,
            pixelOffset: new Cesium.Cartesian2(0, 0),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            showBackground: true,
            backgroundColor: Cesium.Color.WHITE.withAlpha(0.8),
            backgroundPadding: new Cesium.Cartesian2(6, 4),
            heightReference: Cesium.HeightReference.CLAMP_TO_3D_TILE,
            eyeOffset: new Cesium.Cartesian3(0, 0, -10),
        });

    // text는 Property 타입이어야 함
    if (lg.text && "setValue" in lg.text) {
        (lg.text as Cesium.ConstantProperty).setValue(text);
    } else {
        lg.text = new Cesium.ConstantProperty(text);
    }
    entity.label = lg;
}

export default function upsertDrawMarkers(
    viewer: Cesium.Viewer,
    points: Cartesian3[],
    distance: number
) {
    // 1) 인덱스별 업서트
    const keepIds = new Set<string>();
    for (let i = 0; i < points.length; i++) {
        const id = `draw_marker_${i}`;
        keepIds.add(id);

        const pos = points[i];
        let ent = viewer.entities.getById(id);

        if (!ent) {
            ent = viewer.entities.add({
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
            const p = ent.position;
            if (isConstPos(p)) p.setValue(pos);
            else ent.position = new Cesium.ConstantPositionProperty(pos);
        }
    }

    // 2) 꼬리 라벨 갱신 (이 부분이 "실시간"의 핵심)
    const lastIdx = points.length - 1;
    for (let i = 0; i < points.length; i++) {
        const ent = viewer.entities.getById(`draw_marker_${i}`);
        if (!ent) continue;

        if (i === lastIdx && points.length > 0) {
            // 마지막 마커에만 최신 거리 표시
            const text = distance < 1000 ? `${distance.toFixed(0)} m` : `${(distance / 1000).toFixed(2)} km`;
            setTailLabel(ent, text);
        } else {
            // 이전 마커들의 라벨은 제거해 깔끔하게 유지
            ent.label = undefined;
        }
    }

    // 3) 초과 마커 정리
    const toRemove: Cesium.Entity[] = [];
    for (const e of viewer.entities.values) {
        if (e.id.startsWith("draw_marker_") && !keepIds.has(e.id)) {
            toRemove.push(e);
        }
    }
    toRemove.forEach((e) => viewer.entities.remove(e));
}
