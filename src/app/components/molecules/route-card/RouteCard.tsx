import styles from './RouteCard.module.css';
import { useDispatch } from 'react-redux';
import { Route } from '@/type/route';
import * as Cesium from 'cesium';
import { setPedestrianRoute } from '@/app/store/redux/feature/routeDrawingSlice';
import getViewer from '@/app/components/organisms/cesium/util/getViewer';
import { upsertPedestrianMarker } from '@/app/pages/route-drawing/utils/addPedestrianEntity';
import {Card, CardContent, CardMedia, Typography} from "@mui/material";

type Props = {
    route: Route;
    /** 부모(LeftSideBar)가 선택 전 처리(열/닫기, 기존 정리)를 수행하고
     *  'activate'일 때만 RouteCard가 엔티티 생성+flyTo를 실행 */
    onBeforeSelect?: (route: Route) => 'activate' | 'close';
};

export default function RouteCard({ route, onBeforeSelect }: Props) {
    const viewer = getViewer();
    const dispatch = useDispatch();

    const onClick = () => {
        const decision = onBeforeSelect?.(route) ?? 'activate';
        if (decision !== 'activate') return; // 부모가 닫기로 결정한 경우 종료

        // 1) 경로 좌표 직렬화
        const positions = route.sections
            .flatMap((s) => s.points)
            .map((p) => Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude, p.height ?? 0));

        // 2) 마커(각 섹션 시작점 + 마지막 종료점)
        route.sections.forEach((s) => {
            const p0 = s.points[0];
            upsertPedestrianMarker(Cesium.Cartesian3.fromDegrees(p0.longitude, p0.latitude, p0.height ?? 0));
        });
        const last = route.sections.at(-1)!.points.at(-1)!;
        upsertPedestrianMarker(Cesium.Cartesian3.fromDegrees(last.longitude, last.latitude, last.height ?? 0));

        // 3) 엔티티 생성
        const entity = new Cesium.Entity({
            id: 'pedestrian_entity',
            polyline:
                positions.length >= 2
                    ? {
                        positions,
                        width: 10,
                        material: Cesium.Color.fromCssColorString('#F0FD3C'),
                        clampToGround: true,
                    }
                    : undefined,
        });
        viewer.entities.add(entity);

        // 4) 화면에 맞게 이동
        flyToFit(viewer, positions, { paddingFactor: 1.2, duration: 0.3 });

        // 5) 선택 경로 상태 저장 (필요 시)
        dispatch(setPedestrianRoute(route));
    };

    return (
        <>
            <div className={styles.routeCard} onClick={onClick}>
                <Card sx={{ maxWidth: 345 }}>
                    <CardMedia
                        sx={{ height: 140 }}
                        image='/resource/sample-image.png'
                        title='thumbnail'
                    />
                    <CardContent>
                        <Typography gutterBottom variant="h5" component="div">
                            {route.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            거리: {route.distance}km / 가능 시간: {'TODO'}~{'TODO'}
                        </Typography>

                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {route.description}
                        </Typography>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

/* ---- flyToFit: 타입 안전 & 기본 0.3s ---- */
function flyToFit(
    viewer: Cesium.Viewer,
    positions: Cesium.Cartesian3[],
    opts?: { paddingFactor?: number; heading?: number; pitch?: number; duration?: number }
) {
    const { scene, camera } = viewer;
    const sphere = Cesium.BoundingSphere.fromPoints(positions);

    const frustum = camera.frustum as
        | Cesium.PerspectiveFrustum
        | Cesium.OrthographicFrustum
        | Cesium.PerspectiveOffCenterFrustum;
    const fovy = 'fovy' in frustum ? frustum.fovy as number : Cesium.Math.toRadians(60);

    const aspect = (scene.canvas.clientWidth || 1) / (scene.canvas.clientHeight || 1);
    const fitH = sphere.radius / Math.tan(fovy / 2);
    const fitW = fitH / aspect;
    const range = Math.max(fitH, fitW) * (opts?.paddingFactor ?? 1.2);

    const heading = opts?.heading ?? camera.heading;
    const pitch = opts?.pitch ?? Cesium.Math.toRadians(-30);

    return camera.flyToBoundingSphere(sphere, {
        offset: new Cesium.HeadingPitchRange(heading, pitch, range),
        duration: opts?.duration ?? 0.3,
    });
}
