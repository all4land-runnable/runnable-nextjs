import * as Cesium from "cesium";
import {Cartesian3} from "cesium";
import upsertDrawMarkers from "@/app/utils/markers/upsertDrawMarkers";
import {getViewer} from "@/app/components/templates/cesium/viewer/getViewer";
import {getDrawer} from "@/app/components/templates/cesium/drawer/getDrawer";

let draw_polyline: string = "";

export default async function drawingStart(onEnd: (entity: Cesium.Entity, positions: Cartesian3[])=>void) {
    const viewer = await getViewer();
    const drawer = await getDrawer();

    drawer.start({
        type: "POLYLINE",
        once: true,
        finalOptions: { // 드로잉 종료 직후 엔티티
            width: 8,
            material: Cesium.Color.RED,
            clampToGround: true,
        },
        onPointsChange: (points)=>{ // 그리기 중 마우스 이동 시 콜백 함수
            upsertDrawMarkers(points)

            let meters = 0;

            for (let i = 0; i + 1 < points.length; i++) {
                const start = Cesium.Cartographic.fromCartesian(points[i]);
                const end = Cesium.Cartographic.fromCartesian(points[i + 1]);
                meters += new Cesium.EllipsoidGeodesic(start, end).surfaceDistance;
            }
            // 예: 콘솔/툴팁/라벨 갱신
            // console.log(`길이: ${(meters/1000).toFixed(2)} km`);

            viewer.scene.requestRender?.(); // requestRenderMode일 때 즉시 반영
        },
        onEnd: (entity, positions)=>{
            draw_polyline = entity.id // 새로운 엔티티 아이디 저장
            onEnd(entity, positions); // 추가 로직 실행
        }
    })
}

export async function removeDrawPolyline() {
    const viewer = await getViewer();

    viewer.entities.removeById(draw_polyline)
}