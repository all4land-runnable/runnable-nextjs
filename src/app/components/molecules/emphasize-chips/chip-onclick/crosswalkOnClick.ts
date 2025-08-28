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

    // 6) NODE 인덱스(반경 내 것만)
    const nodeIdx = new Map<number, NodeWithLatLng>();
    for (const n of nodesInRadius) nodeIdx.set(n.node_id as number, n);

    // 7) 중복 방지
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
    for (const l of linksInRadius) {
        // 링크 엔티티에 이용할 고유 아이디 생성
        const id = `crosswalk-link-${l.lnkg_id as number}`;

        // 이미 그려졌거나(viewer.entities에 존재) drawn Set에 등록된 경우는 스킵
        if (drawn.has(id) || viewer.entities.getById(id)) continue;

        // 링크 좌표 배열 가져오기 (없거나 2개 미만이면 스킵)
        const coords = linkCoordCache.get(l.lnkg_id as number);
        if (!coords || coords.length < 2) continue;

        // 좌표 배열을 [lon,lat,lon,lat,...] 형태로 변환
        const degArray: number[] = [];
        for (const [lon, lat] of coords) {
            if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
            degArray.push(lon, lat);
        }

        // 좌표가 2점 미만이면(최소 4개 숫자 필요) 스킵
        if (degArray.length < 4) continue;

        // Cesium에서 사용 가능한 Cartesian3 polyline 좌표로 변환
        const polylinePositions = Cesium.Cartesian3.fromDegreesArray(degArray);

        // Viewer에 엔티티 추가 (Polyline)
        viewer.entities.add({
            id,
            polyline: {
                positions: polylinePositions, // 경로 좌표
                width: 4, // 선 두께
                material: Cesium.Color.fromBytes(40, 200, 255).withAlpha(0.9), // 선 색상
                clampToGround: true, // 지표면에 붙이기
            }
        });

        // 중복 방지 Set에 등록
        drawn.add(id);
    }

}
