import * as Cesium from "cesium";
import {Cartesian3, Entity, JulianDate} from "cesium";
import apiClient from "@/api/apiClient";
import { PedestrianResponse } from "@/api/response/pedestrianResponse";
import getViewer from "@/app/components/templates/cesium/util/getViewer";
import {getPedestrianRoute, setPedestrianRoute,} from "@/app/staticVariables";
import requestRender from "@/app/components/templates/cesium/util/requestRender";

/**
 * 임시 경로 그리기를 완료했을 때 실행되는 함수
 * - Tmap 보행자 경로를 구간별로 이어붙여 Cesium Polyline을 그림
 * - 전역 pedestrianRoute 엔티티를 갱신
 *
 * @param tempRoute
 * @param isCircular 원형 경로 여부 (true면 마지막 점을 시작점에 연결)
 * @returns routeCourse [lng, lat][] (Cesium.fromDegreesArray에 바로 쓸 수 있음)
 */
export async function completeDrawingOnClick(tempRoute: Entity, isCircular: boolean):Promise<[number, number][]> {
    const viewer = getViewer();

    // 1) 모든 구간 보행자 경로를 이어붙여 폴리라인 좌표 생성
    const routeCourse = await makeRouteCourse(tempRoute, isCircular);
    if (routeCourse.length < 2) {
        return routeCourse;
    }

    // 2) Polyline 엔티티 생성 및 추가
    const positions = Cesium.Cartesian3.fromDegreesArray(routeCourse.flat());

    const pedestrianRoute = viewer.entities.add({
        polyline: {
            positions,
            width: 5,
            material: Cesium.Color.fromCssColorString("#4D7C0F"), // Tailwind lime-700
            clampToGround: true,
        },
    });

    // 3) 전역 보관
    setPedestrianRoute(pedestrianRoute);

    // 4) 즉시 렌더 요청
    viewer.scene.requestRender?.();

    return routeCourse;
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

    // LineString만이 아니라 Point 포함 모든 좌표를 합친다
    return flattenAllCoordinates(pedestrianResponse);
}


/** Property 타입에 getValue가 있는지 확인하는 type guard */
function hasGetValue(
    prop: unknown
): prop is { getValue: (time: JulianDate) => unknown } {
    return typeof (prop as { getValue?: unknown })?.getValue === "function";
}

/** 폴리라인 Entity에서 현재 시각의 [lng,lat][]를 뽑아낸다 */
function getPolylineLngLatList(route: Entity, when: JulianDate): [number, number][] {
    const C = window.Cesium;
    const posProp = route.polyline?.positions;
    if (!posProp) return [];

    const positions: Cartesian3[] = hasGetValue(posProp)
        ? (posProp.getValue(when) as Cartesian3[])
        : (posProp as unknown as Cartesian3[]);

    if (!positions || positions.length === 0) return [];

    return positions.map((c3: Cartesian3) => {
        const carto = C.Cartographic.fromCartesian(c3);
        return [
            C.Math.toDegrees(carto.longitude),
            C.Math.toDegrees(carto.latitude),
        ];
    });
}

/**
 * 폴리라인(경로 엔티티) 기준으로 Tmap 보행자 경로를 이어붙여
 * Cesium Polyline에 바로 넣을 수 있는 [lng, lat][] 반환
 * (기존 로직 유지: 5개 단위로 start + (최대 5 경유) + end 호출)
 */
export async function makeRouteCourse(
    tempRoute: Entity,
    isCircular: boolean
): Promise<[number, number][]> {
    const viewer = getViewer();
    const when = viewer.clock.currentTime;

    // 1) 폴리라인의 정점들을 [lng,lat][]로 추출
    const vertices = getPolylineLngLatList(tempRoute, when);

    // 2) 원형 경로면 시작점 재부착
    const markers: [number, number][] =
        !isCircular && vertices.length > 0 ? [...vertices, vertices[0]] : [...vertices];

    const routeCourse: [number, number][] = [];
    if (markers.length < 2) return routeCourse;

    // 3) 5개 단위로 세그먼트 요청을 모아 실행
    const tasks: Promise<[number, number][]>[] = [];
    for (let i = 0; i < markers.length - 1; i += 5) {
        const [startX, startY] = markers[i];

        const remaining = markers.length - (i + 1);
        const stepCount = Math.min(5, remaining); // 이번 배치에서 사용할 경유지 수(최대 5)

        const passListCoords: string[] = [];
        for (let j = 1; j < stepCount; j++) {
            const [viaX, viaY] = markers[i + j];
            passListCoords.push(`${viaX},${viaY}`);
        }
        const passList = passListCoords.length ? passListCoords.join("_") : undefined;

        const [endX, endY] = markers[i + stepCount];
        tasks.push(fetchPedestrianSegment({ startX, startY, endX, endY, passList }));
    }

    // 4) 세그먼트 합치기(연속 중복 제거)
    const segments = await Promise.all(tasks);
    for (const seg of segments) {
        if (!seg || seg.length === 0) continue;
        if (routeCourse.length === 0) {
            routeCourse.push(...seg);
        } else {
            for (const c of seg) pushIfNotDuplicate(routeCourse, c);
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