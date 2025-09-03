import * as Cesium from "cesium";
import type { Cartesian3 } from "cesium";

export const drawMarkerEntities:Cesium.Entity[] = [];

/**
 * 마지막 엔티티에 라벨을 지정하는 함수
 *
 * @param entity 마지막 마커
 * @param text 입력할 문구
 */
function setTailLabel(entity: Cesium.Entity, text: string) {
    const label = entity.label
        ?? new Cesium.LabelGraphics({ // 기존 라벨 속성 활용 (병원 라벨과 동일)
            font: "14px sans-serif",
            fillColor: Cesium.Color.BLACK,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.TOP,
            pixelOffset: new Cesium.Cartesian2(0, -40),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            showBackground: true,
            backgroundColor: Cesium.Color.WHITE.withAlpha(0.8),
            backgroundPadding: new Cesium.Cartesian2(6, 4),
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            eyeOffset: new Cesium.Cartesian3(0, 0, -20),
        });

    // text는 Property 타입이어야 함
    label.text = new Cesium.ConstantProperty(text);

    // 엔티티에 라벨 지정
    entity.label = label;
}

/**
 * 마커의 위치를 수정+ 셍상하는 함수
 *
 * @param viewer cesium 뷰어
 * @param points 현재 클릭된 위치들
 * @param distance 위치들간의 총 거리
 */
export default function upsertDrawMarkers(
    viewer: Cesium.Viewer,
    points: Cartesian3[],
    distance: number
) {
    // NOTE 1. 마커 위치 업서트
    points.forEach((position, index) => {
        if (drawMarkerEntities.length > index) // 만약 이미 엔티티가 존재하면
            drawMarkerEntities[index].position = new Cesium.ConstantPositionProperty(position); // 위치 재갱신
        else {
            const drawMarkerEntity = viewer.entities.add({ //없으면 새로 생성
                position: new Cesium.ConstantPositionProperty(position),
                point: {
                    pixelSize: 10,
                    color: Cesium.Color.RED,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
            });

            drawMarkerEntities.push(drawMarkerEntity);
        }

    })

    // NOTE 2. 거리 라벨 실시간 갱신
    const lastIdx = points.length - 1;

    points.forEach((_, index) => {
        // 마커 조회
        const entity = drawMarkerEntities[index];

        if (!entity) return; // 예외처리: 없다면 종료

        // 마지막 인덱스인 경우
        if (index === lastIdx && points.length > 0) {
            // 1km 전까진 m 단위로 표시
            const text = distance < 1000
                ? `예상거리: ${distance.toFixed(0)} m`
                : `예상거리: ${(distance / 1000).toFixed(2)} km`;
            setTailLabel(entity, text);
        } else
            entity.label = undefined; // 이전 마커들의 라벨은 제거
    })

    // NOTE 3. 초과된 마커만 정리한다.
    while (drawMarkerEntities.length > points.length) {
        const ent = drawMarkerEntities.pop()!; // 마지막 요소만 제거
        viewer.entities.remove(ent);
    }
    viewer.scene.requestRender?.();
}
