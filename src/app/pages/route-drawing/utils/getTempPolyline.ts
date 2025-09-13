import {Cartesian3, Entity} from "cesium";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";
import * as Cesium from "cesium";

export const getTempPolyline = (entities: Entity[], entityId:string, circular:boolean=false) => {
    const viewer = getViewer();

    // 1) 마커 → 현재 좌표 배열(Cartesian3[]) 추출
    const time = viewer.clock.currentTime;
    const isFiniteCartesian3 = (c?: Cartesian3): c is Cartesian3 =>
        !!c && Number.isFinite(c.x) && Number.isFinite(c.y) && Number.isFinite(c.z);

    // 2) API/파싱에서 닫힌 경로를 원한다면 마커 배열에도 첫 점을 한 번 더 넣어준다.
    //    (같은 엔티티를 push해도 좌표 값만 쓰는 로직이면 무방)
    if(circular) {
        entities.push(entities[0]);
    }

    const positions: Cartesian3[] = entities
        .map((m: Entity) => m.position?.getValue?.(time) as Cartesian3 | undefined) // ← TS: m에 타입 명시
        .filter(isFiniteCartesian3);

    if (positions.length >= 2) {

        // 3) 기존 temp polyline 엔티티를 동일 id로 교체하여 시각적으로 '닫힌 선'을 표시 (선택)
        viewer.entities.removeById(entityId);
        viewer.entities.add(
            new Cesium.Entity({
                id: entityId,
                polyline: {
                    positions,
                    width: 10,
                    material: Cesium.Color.RED,
                    clampToGround: true,
                },
            })
        );
    }
}