import apiClient from "@/api/apiClient";
import { UnactiveError } from "@/error/unactiveError";
import { Crosswalk } from "@/api/response/crosswalkResponse";
import * as Cesium from "cesium";
import { parseFromWK } from "wkt-parser-helper";
import type { Geometry, LineString } from "geojson";
import radiusFilter from "@/app/utils/radiusFilter";
import buildDashedSegmentsFromDegrees from "@/app/utils/buildDashedSegmentsFromDegrees";
import getViewer from "@/app/components/templates/cesium/util/getViewer";
import {getCameraPosition} from "@/app/components/templates/cesium/util/getCameraPosition";
import {getCrosswalk} from "@/app/staticVariables";
import CommonResponse from "@/api/response/common_response";

/**
 * 카메라 기준 반경 내의 횡단보도(NODE/LINK)만 렌더링
 */
export async function crosswalkOnClick() {
    // NOTE 1. 전역 Viewer 대기
    const viewer = getViewer();
    const point = getCameraPosition();

    // NOTE 2. 음수대 조회 API
    const response = await apiClient.get<CommonResponse<Crosswalk[]>>("/api/v1/dataset/crosswalks", {
        baseURL: process.env.NEXT_PUBLIC_FASTAPI_URL,
        params: {
            lat: point.lat,
            lon: point.lon,
            radius_m:500,
        }
    });

    // api response 데이터 반환
    const crosswalkResponse: CommonResponse<Crosswalk[]> = response?.data;
    const crosswalks: Crosswalk[] = crosswalkResponse.data ?? [];

    // NOTE 3. 예외처리 (음수대가 조회되지 않았을 경우)
    if (crosswalks.length <= 0) {
        alert("주변에 조회된 횡단보도가 없습니다.");
        throw new UnactiveError(-101, "버튼 비활성화");
    }

    // NOTE 4. 횡단보도 경로(LINK) 정보 조회
    // link 객체 생성
    const links = crosswalks.filter((c) => c.node_type === "LINK" && c.lnkg_id && c.lnkg_wkt);
    const linksInRadius: Crosswalk[] = [];

    // LINK WKT geojson 형식 (경로를 아이디 기반으로 매핑하였다.)
    const linkCoordCache = new Map<number, [number, number][]>();

    for (const link of links) {
        try {
            // WKT -> GeoJSON으로 변경
            const geometry = parseFromWK(link.lnkg_wkt as string) as Geometry;

            // 예외처리: LineString이 아니면 좌표 배열이 없음
            if (geometry?.type !== "LineString")
                continue;

            // WKT의 좌표를 기반으로 기존 객체에 LineString 정보 추가
            const coords = (geometry as LineString).coordinates as [number, number][];

            // 예외처리: 선이 그려질려면 좌표가 최소 2개 이상 존재해야 함
            if (!Array.isArray(coords) || coords.length < 2)
                continue;

            // 이 링크의 좌표 중 하나라도 반경 내인지 검사
            const vertexObjs = coords.map(([lon, lat]) => ({ lat: String(lat), lng: String(lon) }));
            const hit = radiusFilter(vertexObjs, point.lat, point.lon).length > 0;

            if (hit) {
                linksInRadius.push(link);
                linkCoordCache.set(link.lnkg_id as number, coords);
            }
        } catch {}
    }

    // NOTE 7. 횡단보도 경로(LINK) 그리기
    for (const link of linksInRadius) {
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

        // 연속 polyline 대신, 대시 세그먼트 생성 후 각각 polyline 엔티티로 추가
        const dashSegments = buildDashedSegmentsFromDegrees(degArray);

        dashSegments.forEach((seg, idx) => {
            const dashId = `crosswalk-link_${link.lnkg_id as number}-dash-${idx}`;
            if (viewer.entities.getById(dashId)) return;

            const crosswalkEntity = viewer.entities.add({
                id: dashId,
                polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArray(seg), // 대시 구간 좌표
                    width: 12, // 선 두께
                    // '횡단보도 느낌'을 위해 거의 불투명한 흰색 추천 (원하면 기존 색으로 변경 가능)
                    material: Cesium.Color.WHITE,
                    clampToGround: true, // 지표면에 붙이기
                },
                // (선택) 속성 태그
                properties: new Cesium.PropertyBag({
                    type: "CROSSWALK_DASH",
                    lnkg_id: link.lnkg_id,
                }),
            });

            // 횡단보도 엔티티 저장
            getCrosswalk().push(crosswalkEntity);
        });

        // 두 NODE 사이 중앙점에 아이콘 표시
        const iconId = `crosswalk-link_icon-${link.lnkg_id as number}`;
        if (!viewer.entities.getById(iconId)) {
            const startLon = degArray[0];
            const startLat = degArray[1];
            const endLon   = degArray[degArray.length - 2];
            const endLat   = degArray[degArray.length - 1];

            const midLon = (startLon + endLon) / 2;
            const midLat = (startLat + endLat) / 2;

            const crosswalkIconEntity = viewer.entities.add({
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
                }
            });

            // 횡단보도 엔티티 저장
            getCrosswalk().push(crosswalkIconEntity);
        }
    }
}