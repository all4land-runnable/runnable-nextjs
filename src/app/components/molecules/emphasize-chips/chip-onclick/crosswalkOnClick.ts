import apiClient from "@/api/apiClient";
import { UnactiveError } from "@/error/unactiveError";
import { CrosswalkResponse, Crosswalk } from "@/api/response/crosswalkResponse";
import { getCameraPosition, getViewer } from "@/app/components/templates/cesium/getViewer";
import * as Cesium from "cesium";
import { parseFromWK } from "wkt-parser-helper";
import type { Geometry, Point, LineString } from "geojson";
import radiusFilter from "@/app/utils/radiusFilter";

/**
 * 카메라 기준 반경 내의 횡단보도(NODE/LINK)만 렌더링
 */
export default async function crosswalkOnClick() {
    // NOTE 1. 전역 Viewer 대기
    const viewer = await getViewer();
    const point = await getCameraPosition(viewer);

    // NOTE 2. 음수대 조회 API
    const response = await apiClient.get("/dataset/crosswalk.json", {
        baseURL: "http://localhost:3000",
    });

    // api response 데이터 반환
    const crosswalkResponse: CrosswalkResponse = response?.data;
    const crosswalks: Crosswalk[] = crosswalkResponse?.DATA ?? [];

    // NOTE 3. 예외처리 (음수대가 조회되지 않았을 경우)
    if (!Array.isArray(crosswalks) || crosswalks.length <= 0) {
        alert("주변에 조회된 횡단보도가 없습니다.");
        throw new UnactiveError(-101, "버튼 비활성화");
    }

    // NODE / LINK 객체 생성
    const nodes = crosswalks.filter((c) => c.node_type === "NODE" && c.node_id && c.node_wkt);
    const links = crosswalks.filter((c) => c.node_type === "LINK" && c.lnkg_id && c.lnkg_wkt);

    // NOTE 4. 데이터 파싱
    // lat, lng가 있는 타입 생성
    type NodeWithLatLng = Crosswalk & { lat: string; lng: string };

    // NOTE 4-1. 횡단보도 양 끝(NODE) 정보 조회
    const nodesWithCoords: NodeWithLatLng[] = [];
    for (const node of nodes) {
        // WKT -> GeoJSON으로 변경
        try {
            const geometry = parseFromWK(node.node_wkt as string) as Geometry;
            // 예외처리: Point가 아니면 좌표값이 없음
            if (geometry?.type !== "Point") continue;

            // WKT의 좌표를 기반으로 기존 객체에 위도 경도 정보 추가
            const [lon, lat] = (geometry as Point).coordinates as [number, number];
            if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
            nodesWithCoords.push({ ...node, lat: String(lat), lng: String(lon) });
        } catch {}
    }

    // 반경 필터링
    const nodesInRadius = radiusFilter(nodesWithCoords, point.lat, point.lon);

    // NOTE 4-2. 횡단보도 경로(LINK) 정보 조회
    const linksInRadius: Crosswalk[] = [];

    // LINK WKT geojson 형식 (경로를 아이디 기반으로 매핑하였다.)
    const linkCoordCache = new Map<number, [number, number][]>();

    for (const link of links) {
        // WKT -> GeoJSON으로 변경
        try {
            const geometry = parseFromWK(link.lnkg_wkt as string) as Geometry;

            // 예외처리: LineString이 아니면 좌표 배열이 없음
            if (geometry?.type !== "LineString") continue;

            // WKT의 좌표를 기반으로 기존 객체에 LineString 정보 추가
            const coords = (geometry as LineString).coordinates as [number, number][];
            // 예외처리: 선이 그려질려면 좌표가 최소 2개 이상 존재해야 함
            if (!Array.isArray(coords) || coords.length < 2) continue;

            // 이 링크의 좌표 중 하나라도 반경 내인지 검사
            // radiusFilter 재사용을 위해 임시 객체 배열로 변환
            const vertexObjs = coords.map(([lon, lat]) => ({ lat: String(lat), lng: String(lon) }));
            const hit = radiusFilter(vertexObjs, point.lat, point.lon).length > 0;

            if (hit) {
                linksInRadius.push(link);
                linkCoordCache.set(link.lnkg_id as number, coords);
            }
        } catch {}
    }

    // NOTE 5. 예외처리 (횡단보도가 조회되지 않았을 경우)
    if (nodesInRadius.length <= 0 && linksInRadius.length <= 0) {
        alert(`반경 500m 내에 표시할 횡단보도 데이터가 없습니다.`);
        throw new UnactiveError(-101, "버튼 비활성화");
    }

    // NODE 인덱스(반경 내 것만)
    const nodeIdx = new Map<number, NodeWithLatLng>();
    for (const n of nodesInRadius) nodeIdx.set(n.node_id as number, n);

    // 중복 방지
    const drawn = new Set<string>();

    // NOTE 6. 횡단보도 양끝단 그리기
    for (const n of nodesInRadius) {
        // 노드에 이용할 아이디 생성
        const id = `crosswalk-node-${n.node_id as number}`;

        // 이미 존재하는 객체면 추가하지 않음
        if (viewer.entities.getById(id)) continue;

        // 엔티티 추가
        viewer.entities.add({
            id, // 고유 엔티티 ID
            position: Cesium.Cartesian3.fromDegrees(Number(n.lng), Number(n.lat)),
            point: { // 화면에 점(Point)으로 표현하는 그래픽 설정
                pixelSize: 8, // 점의 화면상 지름(px)
                color: Cesium.Color.WHITE, // 점 내부 색상
                outlineColor: Cesium.Color.BLACK, // 점 외곽선 색상
                outlineWidth: 2, // 점 외곽선 두께(px)
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,  // 지표면에 점을 밀착시킴(지형/3D타일 높이 반영)
            }
        });
    }

    // NOTE 7. 횡단보도 경로(LINK) 그리기
    for (const link of linksInRadius) {
        // 링크 엔티티에 이용할 고유 아이디 생성
        const id = `crosswalk-link-${link.lnkg_id as number}`;

        // 이미 그려졌거나(viewer.entities에 존재) drawn Set에 등록된 경우는 스킵
        if (drawn.has(id) || viewer.entities.getById(id)) continue;

        // 링크 좌표 배열 가져오기 (없거나 2개 미만이면 스킵)
        const coords = linkCoordCache.get(link.lnkg_id as number);
        if (!coords || coords.length < 2) continue;

        // 좌표 배열을 [lon,lat,lon,lat,...] 형태로 변환
        const degArray: number[] = [];
        for (const [lon, lat] of coords) {
            if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
            degArray.push(lon, lat);
        }
        // 좌표가 2점 미만이면(최소 4개 숫자 필요) 스킵
        if (degArray.length < 4) continue;

        // (변경) 연속 polyline 대신, 대시 세그먼트 생성 후 각각 polyline 엔티티로 추가
        const dashSegments = buildDashedSegmentsFromDegrees(degArray, DASH_LEN_M, GAP_LEN_M);

        dashSegments.forEach((seg, idx) => {
            const dashId = `crosswalk-link-${link.lnkg_id as number}-dash-${idx}`;
            if (viewer.entities.getById(dashId)) return;

            viewer.entities.add({
                id: dashId,
                polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArray(seg), // 대시 구간 좌표
                    width: 12,                                           // 선 두께
                    // '횡단보도 느낌'을 위해 거의 불투명한 흰색 추천 (원하면 기존 색으로 변경 가능)
                    material: Cesium.Color.WHITE.withAlpha(0.95),
                    clampToGround: true,                                 // 지표면에 붙이기
                },
                // (선택) 속성 태그
                properties: new Cesium.PropertyBag({
                    type: "CROSSWALK_DASH",
                    lnkg_id: link.lnkg_id,
                }),
            });
        });

        // 중복 방지 Set에 등록 (해당 링크는 그려졌다고 표시)
        drawn.add(id);

        // 7-8) 두 NODE 사이 중앙점에 아이콘 표시 (기존 로직 유지)
        const iconId = `crosswalk-link-icon-${link.lnkg_id as number}`;
        if (!viewer.entities.getById(iconId)) {
            const startLon = degArray[0];
            const startLat = degArray[1];
            const endLon   = degArray[degArray.length - 2];
            const endLat   = degArray[degArray.length - 1];

            const midLon = (startLon + endLon) / 2;
            const midLat = (startLat + endLat) / 2;

            viewer.entities.add({
                id: iconId,
                position: Cesium.Cartesian3.fromDegrees(midLon, midLat),
                billboard: {
                    image: '/resource/crosswalk.png',           // 아이콘 URL
                    width: 50,                                   // 아이콘 가로(px)
                    height: 50,                                  // 아이콘 세로(px)
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    pixelOffset: new Cesium.Cartesian2(0, -10),  // 살짝 위로 띄워 가독성 확보
                    disableDepthTestDistance: Number.POSITIVE_INFINITY, // 항상 위에 보이게
                },
                properties: new Cesium.PropertyBag({
                    type: "CROSSWALK_ICON",
                    lnkg_id: link.lnkg_id,
                }),
            });
        }
    }

}

const DASH_LEN_M = 3;  // 대시 길이(미터) - 취향에 맞게 조절
const GAP_LEN_M  = 2;  // 대시 사이 간격(미터)

/**
 * [lon,lat,lon,lat,...] 형태의 경도/위도 배열을 받아
 * 지오데식(타원체 지표면) 거리를 기준으로 '대시-갭' 패턴의
 * 세그먼트들을 [lon,lat,lon,lat] 배열의 리스트로 반환
 */
function buildDashedSegmentsFromDegrees(
    degArray: number[],
    dashLen: number = DASH_LEN_M,
    gapLen: number = GAP_LEN_M
): number[][] {
    const segments: number[][] = [];

    for (let i = 0; i < degArray.length - 2; i += 2) {
        const startLon = degArray[i];
        const startLat = degArray[i + 1];
        const endLon   = degArray[i + 2];
        const endLat   = degArray[i + 3];

        const start = Cesium.Cartographic.fromDegrees(startLon, startLat);
        const end   = Cesium.Cartographic.fromDegrees(endLon,   endLat);
        const geod  = new Cesium.EllipsoidGeodesic(start, end);

        const total = geod.surfaceDistance;
        if (!Number.isFinite(total) || total <= 0) continue;

        // dash-gap 패턴으로 분할
        for (let s = 0; s < total; s += (dashLen + gapLen)) {
            const e  = Math.min(s + dashLen, total);
            const f1 = s / total;
            const f2 = e / total;

            const c1 = geod.interpolateUsingFraction(f1);
            const c2 = geod.interpolateUsingFraction(f2);

            segments.push([
                Cesium.Math.toDegrees(c1.longitude),
                Cesium.Math.toDegrees(c1.latitude),
                Cesium.Math.toDegrees(c2.longitude),
                Cesium.Math.toDegrees(c2.latitude),
            ]);
        }
    }

    return segments;
}
