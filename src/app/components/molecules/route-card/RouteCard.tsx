import { useDispatch } from 'react-redux';
import { Route } from '@/type/route';
import * as Cesium from 'cesium';
import { setPedestrianRoute } from '@/app/store/redux/feature/routeDrawingSlice';
import getViewer from '@/app/components/organisms/cesium/util/getViewer';
import { upsertPedestrianMarker } from '@/app/pages/route-drawing/utils/addPedestrianEntity';
import { Card, CardContent, CardMedia, Typography } from '@mui/material';
import { Box } from '@mui/system';
import {removePedestrianRoute} from "@/app/pages/route-drawing/utils/drawingTempRoute";
import {setRightSidebarOpen} from "@/app/store/redux/feature/rightSidebarSlice";

type Props = {
    route: Route;
    isOpen: boolean;
};

/**
 * 경로를 볼 수 있는 카드이다.
 *
 * @param route 카드의 경로 정보
 * @param isOpen 카드의 활성화 여부
 * @constructor
 */
export default function RouteCard({ route, isOpen }: Props) {
    const viewer = getViewer();
    const dispatch = useDispatch();

    /**
     * 경로 카드를 눌렀을 때 실행
     */
    const onClickRouteCard = () => {
        // NOTE 1. 이미 카드의 세부정보가 열려있는지 확인한다.
        if(isOpen) {
            dispatch(setRightSidebarOpen(false)); // 오른쪽 사이드 바를 닫는다.
            removePedestrianRoute(); // 보행자 경로를 제거한다.
            return; // 열려있다면 굳이 수행하지 않아도 된다.
        }

        // NOTE 2. 기존 경로를 제거한다.
        removePedestrianRoute();

        // NOTE 3. 경로를 그리기 위한 좌표를 취득한다.
        const positions = route.sections
            .flatMap((s) => s.points)
            .map((p) =>
                Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude, p.height ?? 0)
            );

        if (positions.length >= 2) { // 선이 그려질 수 있다면
            // NOTE 4. 각 섹션의 시작점에 마커를 추가한다.
            route.sections.forEach((s) => {
                const p0 = s.points[0];
                upsertPedestrianMarker(
                    Cesium.Cartesian3.fromDegrees(p0.longitude, p0.latitude, p0.height ?? 0)
                );
            });
            // 마지막 섹션은 마지막 포인트까지 마킹한다.
            const last = route.sections.at(-1)!.points.at(-1)!;

            upsertPedestrianMarker(
                Cesium.Cartesian3.fromDegrees(last.longitude, last.latitude, last.height ?? 0)
            );

            // NOTE 5. 엔티티를 추가한다.
            const entity = new Cesium.Entity({
                id: 'pedestrian_entity',
                polyline: {
                    positions,
                    width: 10,
                    material: Cesium.Color.fromCssColorString('#F0FD3C'),
                    clampToGround: true,
                }
            });
            viewer.entities.add(entity);

            // 보행자 경로를 저장한다.
            // TODO: RightSideBar의 정보가 PedestrianRoute로 관리되기 때문이다. 수정해야한다.
            dispatch(setPedestrianRoute(route));

            // 해당 위치로 이동한다.
            flyToEntities(positions, {paddingFactor: 1.2, duration: 0.3});


            // NOTE 6. RightSideBar를 연다.
            dispatch(setRightSidebarOpen(true));
        } else {
            alert("해당 경로를 그릴 수 없습니다.(2개 이상의 좌표)")
        }
    };

    return (
        <Card
            onClick={onClickRouteCard}
            sx={{
                width: '100%',
                display: 'block',
                borderRadius: 4,
                overflow: 'hidden',
                scrollSnapAlign: 'start', // 역할 조사하기
            }}
        >
            {/* 16:9 썸네일 */}
            <Box sx={{ position: 'relative', aspectRatio: '16/9', width: '100%' }}>
                <CardMedia
                    component="img"
                    src="/resource/sample-image.png"
                    alt="thumbnail"
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        width: 1,
                        height: 1,
                        objectFit: 'cover' // 역할 조사하기
                    }}
                />
            </Box>

            <CardContent sx={{ px: 2, pb: 2 }}> {/* 패딩값인가? */}
                <Typography variant="h6" fontWeight={800} gutterBottom>
                    {route.title}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                    거리:&nbsp;{route.distance}km / 가능&nbsp;시간:&nbsp;{'TODO'}~{'TODO'} {/* &nbsp;는 줄바꿈이 없는 공백을 의미한다. */}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}> {/* 역할 조사하기 */}
                    {route.description}
                </Typography>
            </CardContent>
        </Card>
    );
}

/**
 * 경로와 알맞는 위치에 카메라를 움식이는 함수
 * @param positions
 * @param opts
 */
function flyToEntities(
    positions: Cesium.Cartesian3[],
    opts?: { paddingFactor?: number; heading?: number; pitch?: number; duration?: number }
) {
    const { scene, camera } = getViewer();

    // 모든 좌표들이 들어가는 구를 만든다.
    const sphere = Cesium.BoundingSphere.fromPoints(positions);

    // 카메라의 시야 절두체를 조회한다.
    const frustum = camera.frustum;
    if(frustum instanceof Cesium.PerspectiveOffCenterFrustum || frustum instanceof Cesium.OrthographicFrustum) {
        alert("카메라 절두체 조회 실패")
        return;
    }

    // 카메라의 방위각을 조회한다.
    const fovy = frustum.fovy;
    if(!fovy) {
        alert('카메라 화각 조회 실패')
        return;
    }

    // NOTE 1. 종횡비와 거리 계산
    const aspect = (scene.canvas.clientWidth || 1) / (scene.canvas.clientHeight || 1);
    const fitH = sphere.radius / Math.tan(fovy / 2);
    const fitW = fitH / aspect;
    const range = Math.max(fitH, fitW) * (opts?.paddingFactor ?? 1.2);

    // NOTE 2. 카메라 각도 계산
    const heading = opts?.heading ?? camera.heading;
    const pitch = opts?.pitch ?? Cesium.Math.toRadians(-30);

    // NOTE 3. 화면을 이동한다.
    return camera.flyToBoundingSphere(sphere, {
        offset: new Cesium.HeadingPitchRange(heading, pitch, range),
        duration: opts?.duration ?? 0.3,
    });
}
