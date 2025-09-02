import { Entity } from "cesium";
import apiClient from "@/api/apiClient";
import {getViewer} from "@/app/components/templates/cesium/viewer/getViewer";
import {PedestrianResponse} from "@/api/response/pedestrianResponse";
import * as Cesium from "cesium";

export let newRoute: Cesium.Entity | null = null;

export async function completeDrawingOnClick(drawMarkerEntities: Entity[]) {
    const viewer = await getViewer();
    const when = viewer.clock.currentTime;

    const routeCourse:[number, number][] = []

    // 모든 좌표들을 순회
    for(let i = 0; i < drawMarkerEntities.length - 1; i++) {
        const [startX, startY] = getEntityLngLat(drawMarkerEntities[i], when);
        const [endX, endY] = getEntityLngLat(drawMarkerEntities[i + 1], when);

        // NOTE 1. 보행자 경로 API를 조회한다.
        const response = await apiClient.post<PedestrianResponse>(
            "/tmap/routes/pedestrian?version=1&format=json",
            {
                startX, // 출발지 좌표
                startY,
                endX, // 목적지 좌표
                endY,
                // passList: '126.92774822,37.55395475_126.92577620,37.55337145', // 경유지의 X 좌표, Y 좌표
                reqCoordType: "WGS84GEO", // 요청 좌표계
                resCoordType: "WGS84GEO", // 응답 좌표계
                searchOption: "30", // 0(기본값): 추천, 30: 최단거리+계단 제외
                sort: "index", // 지리 정보 개체의 정렬 순서를 지정합니다.
                startName : "출발지",
                endName : "도착지"
            },
            {
                baseURL: "https://apis.openapi.sk.com",
                headers: {
                    appKey: process.env.NEXT_PUBLIC_TMAP_APP_KEY!,
                },
            }
        );
        const pedestrianResponse:PedestrianResponse = response.data;

        // NOTE 2. 실제 보행자 경로를 저장한다.
        pedestrianResponse.features
            .filter(f => f.geometry.type === "LineString")
            .forEach(f => {
                const coords: [number, number][] = f.geometry.coordinates as [number, number][];
                coords.forEach(([lon, lat]) => {
                    routeCourse.push([lon, lat]);
                });
            });

        // NOTE 3. 엔티티를 추가한다.
        const flatCoords = routeCourse.flat();
        if (flatCoords.length >= 4 && flatCoords.length % 2 === 0) {
            viewer.entities.add({
                polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArray(flatCoords),
                    width: 5,
                    material: Cesium.Color.fromCssColorString('#4D7C0F'),
                    clampToGround: true,
                }
            });
        } else {
            console.warn("좌표 개수가 올바르지 않아 polyline을 그리지 않습니다.", flatCoords);
        }
    }

    // NOTE 3. 엔티티를 추가한다.
    newRoute = viewer.entities.add({
        polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray(routeCourse.flat()),
            width: 5,
            material: Cesium.Color.fromCssColorString('#4D7C0F'), // Tailwind `lime-700` 색상
            clampToGround: true, // 경로를 지면에 고정
        }
    });
}

function getEntityLngLat(entity: Entity, when: Cesium.JulianDate): [number, number] {
    const cart = entity.position?.getValue(when);
    if (!cart) throw new Error("Entity has no position");
    const carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cart);
    return [Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude)];
}