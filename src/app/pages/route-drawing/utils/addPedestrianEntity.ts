// src/app/pages/route-drawing/utils/addPedestrianEntity.ts
import * as Cesium from "cesium";
import { Cartesian3, Entity } from "cesium";
import { PedestrianResponse } from "@/api/response/pedestrianResponse";
import { EPS, isFiniteNum, pushIfNotDuplicate } from "@/app/pages/route-drawing/utils/pushIfNotDuplicate";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";
import { getPedestrianRouteMarkers } from "@/app/staticVariables";

// 기존 마커와 위치가 같은지(위경도 기준) 판단
function isSameLonLat(a: Cartesian3, b: Cartesian3): boolean {
    const cartoA = Cesium.Ellipsoid.WGS84.cartesianToCartographic(a);
    const cartoB = Cesium.Ellipsoid.WGS84.cartesianToCartographic(b);
    return (
        Math.abs(Cesium.Math.toDegrees(cartoA.longitude) - Cesium.Math.toDegrees(cartoB.longitude)) < EPS &&
        Math.abs(Cesium.Math.toDegrees(cartoA.latitude)  - Cesium.Math.toDegrees(cartoB.latitude))  < EPS
    );
}

/** 섹션 끝점에 마커 추가(있으면 재사용) */
function upsertPedestrianMarker(position: Cartesian3): Entity {
    const viewer = getViewer(); // getViewer가 async라면: const viewer = await getViewer(); 및 함수 async로 변경
    const now = Cesium.JulianDate.now();

    // 전역 배열에서 같은 위치 마커 있으면 재사용
    const list = getPedestrianRouteMarkers();
    const found = list.find((entity) => {
        const pos = entity.position?.getValue(now) as Cartesian3 | undefined;
        return pos ? isSameLonLat(pos, position) : false; // ✅ undefined 가드
    });
    if (found) return found;

    // 없으면 새로 생성
    const marker = viewer.entities.add({
        position: new Cesium.ConstantPositionProperty(position),
        point: {
            pixelSize: 10,
            color: Cesium.Color.BLACK,
            outlineColor: Cesium.Color.fromCssColorString("#F0FD3C"),
            outlineWidth: 6,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
    });

    // 전역 배열에 등록 (setter가 없다면 push로 등록)
    getPedestrianRouteMarkers().push(marker);

    return marker;
}

/**
 * PedestrianResponse(FeatureCollection) → Cesium Entity(Polyline)
 * - Point / LineString 순서를 properties.index로 정렬하여 순차 연결
 * - 인접 중복 좌표 제거 (연결부 이중 점 제거)
 * - 좌표는 [lng, lat] 기준
 * - 각 LineString의 시작/끝점에 보행자 마커 추가
 */
export function addPedestrianEntity(pedestrianResponse: PedestrianResponse): Entity {
    const features = pedestrianResponse?.features ?? [];

    // 1) index 순 정렬
    const sorted = [...features].sort(
        (a, b) => (a.properties?.index ?? 0) - (b.properties?.index ?? 0)
    );

    // 2) 좌표 평탄화 + 인접 중복 제거 + 섹션 끝점 마커 추가
    const coords: [number, number][] = [];
    let lastTail: [number, number] | undefined;

    for (const f of sorted) {
        if (!f?.geometry) continue;
        if (f.geometry.type === "Point") continue;

        const line = f.geometry.coordinates as [number, number][];
        if (!Array.isArray(line) || line.length === 0) continue;

        // 섹션의 시작/끝점에 마커 추가 (중복 방지)
        const [headLng, headLat] = line[0];
        const [tailLng, tailLat] = line[line.length - 1];
        if (isFiniteNum(headLng) && isFiniteNum(headLat)) {
            upsertPedestrianMarker(Cesium.Cartesian3.fromDegrees(headLng, headLat));
        }
        if (isFiniteNum(tailLng) && isFiniteNum(tailLat)) {
            upsertPedestrianMarker(Cesium.Cartesian3.fromDegrees(tailLng, tailLat));
        }

        // 평탄화하면서 인접 중복 제거
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (!isFiniteNum(c?.[0]) || !isFiniteNum(c?.[1])) continue;

            // 라인 시작점이 직전 tail과 같으면 드롭
            if (
                i === 0 &&
                lastTail &&
                Math.abs(lastTail[0] - c[0]) < EPS &&
                Math.abs(lastTail[1] - c[1]) < EPS
            ) {
                continue;
            }
            pushIfNotDuplicate(coords, c);
        }
        lastTail = coords[coords.length - 1];
    }

    // 3) Entity 생성
    const positions =
        coords.length >= 2 ? Cesium.Cartesian3.fromDegreesArray(coords.flat()) : [];

    return new Cesium.Entity({
        id: "pedestrian_entity",
        polyline: coords.length >= 2
            ? {
                positions,
                width: 10,
                material: Cesium.Color.fromCssColorString("#F0FD3C"),
                clampToGround: true,
            }
            : undefined,
    });
}
