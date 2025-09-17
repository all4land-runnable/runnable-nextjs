import apiClient from "@/api/apiClient";
import { UnactiveError } from "@/error/unactiveError";
import { Crosswalk } from "@/api/response/crosswalkResponse";
import * as Cesium from "cesium";
import { parseFromWK } from "wkt-parser-helper";
import type { Geometry, LineString } from "geojson";
import radiusFilter from "@/app/utils/radiusFilter";
import buildDashedSegmentsFromDegrees from "@/app/utils/buildDashedSegmentsFromDegrees";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";
import { getCameraPosition } from "@/app/components/organisms/cesium/util/getCameraPosition";
import { getCrosswalk } from "@/app/staticVariables";
import CommonResponse from "@/api/response/common_response";

// ──────────────────────────────────────────────────────────
// 클러스터링 한 번만 초기화 플래그
let CROSSWALK_CLUSTERING_READY = false;

/** 숫자 없이 '횡단보도 아이콘'만 보이는 클러스터 스타일 */
function setupCrosswalkClustering(viewer: Cesium.Viewer) {
    if (CROSSWALK_CLUSTERING_READY) return;

    // 기본 데이터소스(= viewer.entities가 들어가는 곳)
    const ds = viewer.dataSourceDisplay
        .defaultDataSource as unknown as Cesium.CustomDataSource;
    const clustering = ds.clustering;

    // 클러스터링 옵션
    clustering.enabled = true;
    clustering.pixelRange = 45;          // 이 픽셀 내의 마커를 묶음
    clustering.minimumClusterSize = 2;   // 2개 이상일 때부터 묶음
    clustering.clusterBillboards = true; // billboard 묶기
    clustering.clusterLabels = true;     // 라벨도 묶이지만 이벤트에서 숨김
    clustering.clusterPoints = true;

    // 클러스터 생성/업데이트 시 아이콘을 교체하고 숫자 라벨은 숨김
    clustering.clusterEvent.addEventListener((entities, cluster) => {
        // 대표 아이콘(클러스터 심볼) - 기존 횡단보도 아이콘으로 교체
        cluster.billboard.show = true;
        cluster.billboard.image = "/resource/crosswalk.svg";
        cluster.billboard.width = 50;
        cluster.billboard.height = 66.456;
        cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
        cluster.billboard.pixelOffset = new Cesium.Cartesian2(0, -10);
        cluster.billboard.disableDepthTestDistance = Number.POSITIVE_INFINITY;

        // 숫자 라벨 숨김 (숫자 배지 제거)
        cluster.label.show = false;

        // 포인트 심볼은 사용 안 함
        if (cluster.point) cluster.point.show = false;
    });

    // 설정 즉시 반영
    const recluster = (clustering as any).recluster;
    if (typeof recluster === "function") {
        recluster.call(clustering);
    } else {
        // 구버전 호환: 토글로 강제 재클러스터
        clustering.enabled = false;
        clustering.enabled = true;
    }

    CROSSWALK_CLUSTERING_READY = true;
}
// ──────────────────────────────────────────────────────────

/**
 * 카메라 기준 반경 내의 횡단보도(NODE/LINK)만 렌더링
 */
export async function crosswalkOnClick() {
    // NOTE 1. 전역 Viewer 대기
    const viewer = getViewer();
    const point = getCameraPosition();

    // ✅ 클러스터링 초기화 (한 번만)
    setupCrosswalkClustering(viewer);

    // NOTE 2. 횡단보도 조회 API
    const response = await apiClient.get<CommonResponse<Crosswalk[]>>(
        "/api/v1/dataset/crosswalks",
        {
            baseURL: process.env.NEXT_PUBLIC_FASTAPI_URL,
            params: { lat: point.lat, lon: point.lon, radius_m: 500 },
        }
    );

    const crosswalkResponse: CommonResponse<Crosswalk[]> = response?.data;
    const crosswalks: Crosswalk[] = crosswalkResponse.data ?? [];

    // NOTE 3. 예외처리
    if (crosswalks.length <= 0) {
        alert("주변에 조회된 횡단보도가 없습니다.");
        throw new UnactiveError(-101, "버튼 비활성화");
    }

    // NOTE 4. LINK 필터링 & 반경 내 선별
    const links = crosswalks.filter(
        (c) => c.node_type === "LINK" && c.lnkg_id && c.lnkg_wkt
    );
    const linksInRadius: Crosswalk[] = [];
    const linkCoordCache = new Map<number, [number, number][]>();

    for (const link of links) {
        try {
            const geometry = parseFromWK(link.lnkg_wkt as string) as Geometry;
            if (geometry?.type !== "LineString") continue;

            const coords = (geometry as LineString).coordinates as [number, number][];
            if (!Array.isArray(coords) || coords.length < 2) continue;

            const vertexObjs = coords.map(([lon, lat]) => ({
                lat: String(lat),
                lng: String(lon),
            }));
            const hit =
                radiusFilter(vertexObjs, point.lat, point.lon).length > 0;

            if (hit) {
                linksInRadius.push(link);
                linkCoordCache.set(link.lnkg_id as number, coords);
            }
        } catch {
            /* ignore */
        }
    }

    // NOTE 7. LINK 그리기 (폴리라인은 클러스터 대상 아님)
    for (const link of linksInRadius) {
        const coords = linkCoordCache.get(link.lnkg_id as number);
        if (!coords || coords.length < 2) continue;

        const degArray: number[] = [];
        for (const [lon, lat] of coords) {
            if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
            degArray.push(lon, lat);
        }
        if (degArray.length < 4) continue;

        // 대시 세그먼트 생성
        const dashSegments = buildDashedSegmentsFromDegrees(degArray);

        // 대시 라인 엔티티 추가
        dashSegments.forEach((seg, idx) => {
            const dashId = `crosswalk-link_${link.lnkg_id as number}-dash-${idx}`;
            if (viewer.entities.getById(dashId)) return;

            const crosswalkEntity = viewer.entities.add({
                id: dashId,
                polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArray(seg),
                    width: 12,
                    material: Cesium.Color.WHITE, // 횡단보도 느낌
                    clampToGround: true,
                },
                properties: new Cesium.PropertyBag({
                    type: "CROSSWALK_DASH",
                    lnkg_id: link.lnkg_id,
                }),
            });

            getCrosswalk().push(crosswalkEntity);
        });

        // 중앙 아이콘(★ 이게 클러스터 대상)
        const iconId = `crosswalk-link_icon-${link.lnkg_id as number}`;
        if (!viewer.entities.getById(iconId)) {
            const startLon = degArray[0];
            const startLat = degArray[1];
            const endLon = degArray[degArray.length - 2];
            const endLat = degArray[degArray.length - 1];

            const midLon = (startLon + endLon) / 2;
            const midLat = (startLat + endLat) / 2;

            const crosswalkIconEntity = viewer.entities.add({
                id: iconId,
                position: Cesium.Cartesian3.fromDegrees(midLon, midLat),
                billboard: {
                    image: "/resource/crosswalk.svg",
                    width: 50,
                    height: 66.456,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    pixelOffset: new Cesium.Cartesian2(0, -10),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
            });

            getCrosswalk().push(crosswalkIconEntity);
        }
    }
}
