// src/app/pages/route-drawing/utils/addPedestrianEntity.ts
import * as Cesium from "cesium";
import { Cartesian3, Entity } from "cesium";
import { PedestrianResponse } from "@/api/response/pedestrianResponse";
import { EPS, isFiniteNum, pushIfNotDuplicate } from "@/app/pages/route-drawing/utils/pushIfNotDuplicate";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";
import { getPedestrianRouteMarkers } from "@/app/staticVariables";

// ⬇ 추가: 총거리 계산 및 포맷
import calcDistance from "@/app/utils/claculator/calcDistance";
import { formatKm } from "@/app/utils/claculator/formatKm";
import requestRender from "@/app/components/organisms/cesium/util/requestRender";

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
export function upsertPedestrianMarker(position: Cartesian3): Entity {
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

/** 마지막 마커에 tailLabel 세팅 */
function setTailLabel(entity: Cesium.Entity, text: string) {
    const label =
        entity.label ??
        new Cesium.LabelGraphics({
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

    label.text = new Cesium.ConstantProperty(text);
    entity.label = label;
}

/**
 * PedestrianResponse(FeatureCollection) → Cesium Entity(Polyline)
 * - Point / LineString 순서를 properties.index로 정렬하여 순차 연결
 * - 인접 중복 좌표 제거 (연결부 이중 점 제거)
 * - 좌표는 [lng, lat] 기준
 * - 각 LineString의 시작/끝점에 보행자 마커 추가
 * - ✅ 전체 경로 총거리 tailLabel을 마지막 마커에 표시
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

    // 마지막 지점 마커 참조(라벨 부착 대상)
    let lastTailMarker: Entity | undefined;

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
            lastTailMarker = upsertPedestrianMarker(Cesium.Cartesian3.fromDegrees(tailLng, tailLat));
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

    const entity = new Cesium.Entity({
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

    // 4) ✅ 총거리 tailLabel 업데이트 (경로가 2점 이상일 때)
    try {
        if (positions.length >= 2) {
            const totalMeters = calcDistance(positions as Cartesian3[]);
            const tailPos =
                positions[positions.length - 1] as Cartesian3;
            const tailMarker = lastTailMarker ?? upsertPedestrianMarker(tailPos);

            setTailLabel(tailMarker, `예상거리: ${formatKm(totalMeters)}`);

            // 즉시 렌더링 요청
            requestRender()
        }
    } catch {
        // 라벨 계산 실패 시 무시 (엔티티 생성은 계속)
    }

    return entity;
}
