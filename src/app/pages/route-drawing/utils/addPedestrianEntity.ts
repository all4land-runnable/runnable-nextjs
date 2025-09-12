// src/app/pages/route-drawing/utils/addPedestrianEntity.ts
import * as Cesium from "cesium";
import { Entity } from "cesium";
import { PedestrianResponse } from "@/api/response/pedestrianResponse";
import {EPS, isFiniteNum, pushIfNotDuplicate} from "@/app/pages/route-drawing/utils/pushIfNotDuplicate";

/**
 * PedestrianResponse(FeatureCollection) → Cesium Entity(Polyline)
 * - Point / LineString 순서를 properties.index로 정렬하여 순차 연결
 * - 인접 중복 좌표 제거 (연결부 이중 점 제거)
 * - 좌표는 [lng, lat] 기준
 */
export function addPedestrianEntity(pedestrianResponse: PedestrianResponse): Entity {
    const features = pedestrianResponse?.features ?? [];

    // 1) index 순 정렬
    const sorted = [...features].sort(
        (a, b) => (a.properties?.index ?? 0) - (b.properties?.index ?? 0)
    );

    // 2) 좌표 평탄화 + 인접 중복 제거
    const coords: [number, number][] = [];
    let lastTail: [number, number] | undefined;

    for (const f of sorted) {
        if (!f?.geometry) continue;

        if (f.geometry.type === "Point") continue

        const line = f.geometry.coordinates as [number, number][];
        if (!Array.isArray(line) || line.length === 0) continue;

        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (!isFiniteNum(c?.[0]) || !isFiniteNum(c?.[1])) continue;

            // 라인 시작점이 직전 tail과 같으면 드롭
            if (i === 0 && lastTail &&
                Math.abs(lastTail[0] - c[0]) < EPS && Math.abs(lastTail[1] - c[1]) < EPS) {
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
                width: 5,
                material: Cesium.Color.fromCssColorString("#4D7C0F"),
                clampToGround: true,
            }
            : undefined,
    });
}