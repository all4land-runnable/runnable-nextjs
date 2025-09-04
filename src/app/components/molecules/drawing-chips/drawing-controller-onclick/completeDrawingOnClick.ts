import * as Cesium from "cesium";
import { Entity } from "cesium";
import apiClient from "@/api/apiClient";
import { PedestrianResponse } from "@/api/response/pedestrianResponse";
import getViewer from "@/app/components/templates/cesium/util/getViewer";
import {
    getPedestrianRoute,
    getTempRoute,
    getTempRouteMarkers,
    setPedestrianRoute,
    setTempRoute
} from "@/app/staticVariables";
import requestRender from "@/app/components/templates/cesium/util/requestRender";
import clearMarkers from "@/app/utils/markers/clearMarkers";

/**
 * 임시 경로 그리기를 완료했을 때 실행되는 함수
 * - Tmap 보행자 경로를 구간별로 이어붙여 Cesium Polyline을 그림
 * - 전역 pedestrianRoute 엔티티를 갱신
 *
 * @param drawMarkerEntities 사용자가 지도에서 지정한 점(엔티티) 목록
 * @param isCircular 원형 경로 여부 (true면 마지막 점을 시작점에 연결)
 * @returns routeCourse [lng, lat][] (Cesium.fromDegreesArray에 바로 쓸 수 있음)
 */
export async function completeDrawingOnClick(
    drawMarkerEntities: Entity[],
    isCircular: boolean
): Promise<[number, number][]> {
    if (!drawMarkerEntities || drawMarkerEntities.length < 2) return [];

    // 1) 모든 구간 보행자 경로를 이어붙여 폴리라인 좌표 생성
    const routeCourse = await makeRouteCourse(drawMarkerEntities, isCircular);
    if (routeCourse.length < 2) return routeCourse;

    // 2) Polyline 엔티티 생성 및 추가
    const viewer = await getViewer();
    const positions = Cesium.Cartesian3.fromDegreesArray(routeCourse.flat());

    const newRoute = viewer.entities.add({
        polyline: {
            positions,
            width: 5,
            material: Cesium.Color.fromCssColorString("#4D7C0F"), // Tailwind lime-700
            clampToGround: true,
        },
    });

    // 3) 전역 보관
    setPedestrianRoute(newRoute);

    // 4) 즉시 렌더 요청
    viewer.scene.requestRender?.();

    return routeCourse;
}

/**
 * 엔티티에서 [lng, lat] 추출
 */
function getEntityLngLat(entity: Entity, when: Cesium.JulianDate): [number, number] {
    const cart = entity.position?.getValue(when);
    if (!cart) throw new Error("Entity has no position");
    const carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cart);
    return [Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude)];
}

/**
 * 연속 좌표 중복 제거용 툴
 */
const EPS = 1e-12;
function pushIfNotDuplicate(acc: [number, number][], c: [number, number]) {
    if (acc.length === 0) {
        acc.push(c);
        return;
    }
    const [plng, plat] = acc[acc.length - 1];
    const [clng, clat] = c;
    if (Math.abs(plng - clng) > EPS || Math.abs(plat - clat) > EPS) {
        acc.push(c);
    }
}

/**
 * PedestrianResponse -> 모든 피처 좌표(Points + LineStrings) 평탄화
 * - properties.index 기준 정렬(안전장치). 이미 sort=index를 넣었지만 재정렬로 보강
 * - 연속 중복 좌표 제거
 */
function flattenAllCoordinates(resp: PedestrianResponse): [number, number][] {
    const features = [...(resp.features ?? [])].sort(
        (a, b) => (a.properties?.index ?? 0) - (b.properties?.index ?? 0)
    );

    const coords: [number, number][] = [];
    for (const f of features) {
        if (!f.geometry) continue;

        if (f.geometry.type === "Point") {
            const pt = f.geometry.coordinates as [number, number];
            if (Number.isFinite(pt?.[0]) && Number.isFinite(pt?.[1])) {
                pushIfNotDuplicate(coords, pt);
            }
        } else if (f.geometry.type === "LineString") {
            const line = f.geometry.coordinates as [number, number][];
            if (Array.isArray(line)) {
                for (const c of line) {
                    if (Number.isFinite(c?.[0]) && Number.isFinite(c?.[1])) {
                        pushIfNotDuplicate(coords, c);
                    }
                }
            }
        }
        // (필요 시 MultiLineString 등 추가 타입을 여기서 더 처리)
    }
    return coords;
}

/**
 * Tmap 보행자 경로 한 구간을 호출해 "모든 지오메트리 좌표"를 평탄화하여 반환
 */
async function fetchPedestrianSegment(params: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    passList?: string;
}): Promise<[number, number][]> {
    const { startX, startY, endX, endY, passList } = params;

    const response = await apiClient.post<PedestrianResponse>(
        "/tmap/routes/pedestrian?version=1&format=json",
        {
            startX, // 출발지 좌표
            startY,
            endX, // 목적지 좌표
            endY,
            passList, // 최대 5개의 경유지를 문자열로 전달
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
                appKey: process.env.NEXT_PUBLIC_TMAP_APP_KEY,
            },
        }
    );
    const pedestrianResponse:PedestrianResponse = response.data;

    // ✅ LineString만이 아니라 Point 포함 모든 좌표를 합친다
    return flattenAllCoordinates(pedestrianResponse);
}

/**
 * 주어진 마커 엔티티들로부터 Tmap 보행자 경로를 이어붙여
 * Cesium Polyline에 바로 넣을 수 있는 [lng, lat][] 반환
 */
export async function makeRouteCourse(
    drawMarkerEntities: Entity[],
    isCircular: boolean
): Promise<[number, number][]> {
    const viewer = await getViewer();
    const when = viewer.clock.currentTime;

    // 원형 경로면 마지막에 시작점을 한 번 더 넣어서 폐합
    const markers =
        isCircular && drawMarkerEntities.length > 0
            ? [...drawMarkerEntities, drawMarkerEntities[0]]
            : [...drawMarkerEntities];

    const routeCourse: [number, number][] = [];
    if (markers.length < 2) return routeCourse;

    // i를 5칸씩 증가시키되, 매 구간마다 "시작 + (최대 5 경유) + 도착" 구성
    for (let i = 0; i < markers.length - 1; i += 5) {
        const [startX, startY] = getEntityLngLat(markers[i], when);

        const remaining = markers.length - (i + 1);
        const stepCount = Math.min(5, remaining); // 이번 구간에서 사용할 경유지 수(최대 5)

        // 경유지(passList) 구성: i+1 ~ i+stepCount-1
        const passListCoords: string[] = [];
        for (let j = 1; j < stepCount; j++) {
            const [viaX, viaY] = getEntityLngLat(markers[i + j], when);
            passListCoords.push(`${viaX},${viaY}`);
        }
        const passList = passListCoords.length ? passListCoords.join("_") : undefined;

        // 도착점: i + stepCount
        const [endX, endY] = getEntityLngLat(markers[i + stepCount], when);

        const segment = await fetchPedestrianSegment({ startX, startY, endX, endY, passList });
        if (segment.length === 0) continue;

        // 이어붙일 때 연속 중복 좌표 제거
        if (routeCourse.length === 0) {
            routeCourse.push(...segment);
        } else {
            for (const c of segment) pushIfNotDuplicate(routeCourse, c);
        }
    }

    return routeCourse;
}

/**
 * 화면에 추가된 경로 엔티티들을 삭제한다.
 * - pedestrianRoute 삭제 후 참조 해제
 */
export function removePedestrianRoute() {
    const viewer = getViewer();
    const pedestrianRoute = getPedestrianRoute();


    viewer.entities.remove(pedestrianRoute);
    setPedestrianRoute(undefined);
    requestRender()
}

/**
 * newRoute(pedestrianRoute)의 가시성을 제어한다.
 * @param visible true면 보이게, false면 숨김
 */
export function setPedestrianRouteVisibility(visible: boolean) {
    const pedestrianRoute = getPedestrianRoute();

    pedestrianRoute.show = visible;
    requestRender()
}