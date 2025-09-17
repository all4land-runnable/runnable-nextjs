import styles from './RouteCard.module.css'
import Image from "next/image";
import { useDispatch } from 'react-redux'
import { toggleOpen } from "@/app/store/redux/feature/rightSidebarSlice";
import {Route} from "@/type/route";
import * as Cesium from "cesium";
import {setPedestrianRoute} from "@/app/store/redux/feature/routeDrawingSlice";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";
import {removePedestrianRoute} from "@/app/pages/route-drawing/utils/drawingTempRoute";
import {upsertPedestrianMarker} from "@/app/pages/route-drawing/utils/addPedestrianEntity";
import {removeMarkers} from "@/app/utils/markers/hideMarkers";
import {getPedestrianRouteMarkers} from "@/app/staticVariables";

type routeCardProps = {
    route: Route;
}

/**
 * 경로 속성 카드를 구현하는 함수
 *
 * @param routeCard 경로 카드 속성
 * @constructor
 */
export default function RouteCard({route}: routeCardProps) {
    const viewer = getViewer();
    const dispatch = useDispatch()

    /**
     * RouteCard 선택 함수
     */
    const toggleRightSidebarOpen = () => {
        // NOTE 1. 기존 엔티티 제거
        removePedestrianRoute() // 보행자 경로 제거
        removeMarkers(getPedestrianRouteMarkers()) // 보행자 경로 마커 제거

        // NOTE 2. route 직렬화
        const positions = route.sections
            .flatMap(section => section.points)
            .map(point => Cesium.Cartesian3.fromDegrees(point.longitude, point.latitude, point.height ?? 0));

        // NOTE 3. 마커 추가
        route.sections.forEach(section => {
            const point = section.points[0]
            upsertPedestrianMarker(Cesium.Cartesian3.fromDegrees(point.longitude, point.latitude, point.height ?? 0 ));
        })
        const point = route.sections[route.sections.length - 1].points[route.sections[route.sections.length - 1].points.length-1];
        upsertPedestrianMarker(Cesium.Cartesian3.fromDegrees(point.longitude, point.latitude, point.height ?? 0 ));

        // NOTE 4. Entity로 추가
        const routeCardEntity = new Cesium.Entity({
            id: "pedestrian_entity",
            polyline: positions.length >= 2
                ? {
                    positions,
                    width: 10,
                    material: Cesium.Color.fromCssColorString("#F0FD3C"),
                    clampToGround: true,
                }
                : undefined,
        });
        viewer.entities.add(routeCardEntity);

        flyToFit(viewer, positions, { paddingFactor: 1.2 });  // 화면에 꽉 차게

        // NOTE 5. routeDrawingSlice에 데이터 저장
        dispatch(setPedestrianRoute(route));
        dispatch(toggleOpen())
    }

    return (
        <div className={styles.routeCard} onClick={()=> toggleRightSidebarOpen()}> {/* RouteCard 가장 밖 테두리, 핸들러 지정 */}
            <div className={styles.imageBox}> {/* 경로 대표 사진 */}
                <Image src={"/resource/sample-image.png"} fill style={{ objectFit: "cover" }} alt=""/>
            </div>

            <span className={styles.titleFont}>{route.title}</span> {/* 경로 제목 */}
            {/* 속성 정보 나열 */}
            <span className={styles.routeInfoFont}>거리: {route.distance}km / 가능 시간:{"TODO"}~{"TODO"}</span>
            {/* 경로 설명 */}
            <span className={[styles.description, styles.descriptionFont].join(' ')}>{route.description}</span>
        </div>
    )
}

// positions: Cesium.Cartesian3[]
function flyToFit(viewer: Cesium.Viewer, positions: Cesium.Cartesian3[], opts?: {
    paddingFactor?: number;   // 여유비 (기본 1.2 = 20% 패딩)
    heading?: number;         // 유지할 heading (기본: 현재)
    pitch?: number;           // 기본: -30도
    duration?: number;        // 비행 시간
}) {
    const scene = viewer.scene;
    const camera = scene.camera;

    const sphere = Cesium.BoundingSphere.fromPoints(positions);
    // @ts-expect-error // 임시로 추가
    const fovy = (camera.frustum as undefined).fovy ?? Cesium.Math.toRadians(60);
    const aspect = scene.canvas.clientWidth / scene.canvas.clientHeight;

    // 세로/가로 기준으로 필요한 거리 계산
    const fitHeight = sphere.radius / Math.tan(fovy / 2);
    const fitWidth  = fitHeight / aspect;
    const padding   = opts?.paddingFactor ?? 1.2;
    const range     = Math.max(fitHeight, fitWidth) * padding;

    const heading = opts?.heading ?? camera.heading;
    const pitch   = opts?.pitch   ?? Cesium.Math.toRadians(-30);

    return camera.flyToBoundingSphere(sphere, {
        offset: new Cesium.HeadingPitchRange(heading, pitch, range),
        duration: opts?.duration ?? 0.5,
    });
}