'use client';

import React, {useEffect, useState} from "react";
import styles from './page.module.css'
import RouteOptionSlider from "@/app/components/molecules/route-option-slider/RouteOptionSlider";
import {formatKm} from "@/app/utils/claculator/formatKm";
import {formatKg} from "@/app/utils/claculator/formatKg";
import {formatPace} from "@/app/utils/claculator/formatPace";
import {Chip} from "@/app/components/atom/chip/Chip";
import {remToPx} from "@/app/utils/claculator/pxToRem";
import {useRouter} from "next/navigation";
import {useModal} from "@/app/store/modal/ModalProvider";
import {getTempRouteMarkers, setTempEntity} from "@/app/staticVariables";
import getDrawer from "@/app/components/organisms/cesium/drawer/getDrawer";
import workoutAvailabilityOnClick from "@/app/utils/drawing-chips/drawing-controller-onclick/workoutAvailabilityOnClick";
import saveDrinkingFountainsInfoOnClick from "@/app/utils/drawing-chips/drawing-controller-onclick/saveDrinkingFountainsInfoOnClick";
import {setRightSidebarOpen} from "@/app/store/redux/feature/rightSidebarSlice";
import {useDispatch} from "react-redux";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";
import * as Cesium from "cesium";
import {Cartesian3, JulianDate} from "cesium";
import {removeTempRoute} from "@/app/pages/route-drawing/utils/drawingTempRoute";
import requestRender from "@/app/components/organisms/cesium/util/requestRender";
import upsertTempRoute from "@/app/pages/route-drawing/utils/upsertTempRoute";
import {resetRouteDrawing, setPedestrianRoute, setTempRoute} from "@/app/store/redux/feature/routeDrawingSlice";
import {parseTempRoute} from "@/app/pages/route-drawing/utils/parseTempRoute";
import {parsePedestrianRoute} from "@/app/pages/route-drawing/utils/parsePedestrianRoute";
import {addPedestrianEntity} from "@/app/pages/route-drawing/utils/addPedestrianEntity";
import {getPedestrianRoute} from "@/app/pages/route-drawing/utils/postPedestrianRoute";

/**
 * 홈 화면을 구현하는 함수
 * @constructor
 */
export default function Page() {
    const router = useRouter();
    const dispatch = useDispatch()
    const viewer = getViewer();
    const drawer = getDrawer();

    const [limitActive, setLimitActive] = useState<boolean>(false); // 거리 제한(meter)
    const [limitRange, setLimitRange] = useState<number>(5);
    const [luggageActive, setLuggageActive] = useState(false); // 짐 무게 (kg)
    const [luggageWeight, setLuggageWeight] = useState(1.5);
    const [paceActive, setPaceActive] = useState(false); // 희망 속도 (분/㎞를 초로 가정: 180(3'00") ~ 480(8'00"))
    const [paceSeconds, setPaceSeconds] = useState(390); // 6'30" = 390초
    const { openConfirm, close } = useModal(); // 모달 여부 // TODO: 필요한가?
    const [ circular, setCircular ] = useState<boolean>(true); // 원형 경로 설정 여부

    /**
     * 이전 페이지로 되돌아가는 함수
     */
    const returnPage = ()=>{
        // NOTE 1. 오른쪽 사이드 바를 닫는다.
        dispatch(setRightSidebarOpen(false));

        // NOTE 2. 그리고 있던 중인 Drawer를 제거한다.
        try{
            drawer.reset() // Drawer 초기화
            try {
                // 원형 경로가 설정되어 있는 경우만
                if(circular)
                    removeCircular() // 원형 경로 제거
            }catch{} // 자동으로 종료된다.

            // 예외처리: Polyline이 존재하지 않는 경우
            removeTempRoute(); // Polyline도 제거한다.
        } catch{}

        // NOTE 3. 페이지를 이전으로 이동한다.
        router.back();
    }

    /**
     * 경로 확정 완료 전 알림 전송
     */
    const completeDrawing= () => {
        openConfirm({
            title: "경로 저장", // 제목
            content: "경로를 저장하시겠습니까?", // 본문
            // 확인 버튼 눌렀을 때 수행될 동작 구현
            onConfirm: async ()=>{
                // TODO: 원형 경로 삭제 후 추가한다.

                // NOTE 1. 임시 경로 엔티티를 불러온다.
                const tempEntityMarkers = getTempRouteMarkers()

                // NOTE 2. 임시 경로를 Route로 파싱한다.
                const tempRoute = await parseTempRoute(tempEntityMarkers);
                dispatch(setTempRoute(tempRoute)); // TempRoute를 저장한다.

                // NOTE 4. 자동 경로 API를 요청한다.
                const coordinates: [number, number][] = tempRoute.sections.flatMap((section) =>
                    section.points.map((point) => [point.longitude, point.latitude] as [number, number])
                );
                console.log("coordinates",coordinates);
                getPedestrianRoute(coordinates)
                    .then(pedestrianResponse=>{
                        // NOTE 5. 자동 경로 엔티티를 불러온다.
                        const pedestrianEntity = addPedestrianEntity(pedestrianResponse);
                        viewer.entities.add(pedestrianEntity);

                        // NOTE 6. 자동 경로를 Route로 파싱한다.
                        parsePedestrianRoute(pedestrianEntity, pedestrianResponse)
                            .then(pedestrianRoute=> dispatch(setPedestrianRoute(pedestrianRoute)));
                    });

                // NOTE 8. 창을 닫는다.
                close();

                // NOTE 9. 화면을 이동한다.
                router.push('/pages/route-save')
            },
            onCancel: close
        })
    }

    /**
     * 원형 경로를 성정하기 위함
     */
    const circularRoute = () => {
        // 만약 원형이 아닌경우, 원형으로 지정
        if (circular) addCircular();
        // 원형을 설정한 경우, 원형 해제
        else removeCircular();
    };

    /**
     * 원형 경로를 설정하는 함수
     */
        // 원형 경로를 설정하는 함수
    const addCircular = () => {
            setCircular(true);

            const tempEntities = getTempRouteMarkers();

            // NOTE 1. 예외처리: 사용자가 지점을 제대로 찍지 않은 경우
            if (!tempEntities || tempEntities.length < 2) {
                alert("최소한 두개의 지점을 선택해주세요.");
                return;
            }

            // NOTE 2. 현재 시각 기준으로 엔티티의 좌표 추출
            const isFiniteCartesian3 = (c?: Cartesian3): c is Cartesian3 =>
                !!c && Number.isFinite(c.x) && Number.isFinite(c.y) && Number.isFinite(c.z);

            const positions = new Cesium.CallbackProperty(
                (t?: JulianDate): Cartesian3[] => {
                    const time = t ?? Cesium.JulianDate.now();

                    const points = getTempRouteMarkers()
                        .map(e => e.position?.getValue?.(time) as Cartesian3 | undefined)
                        .filter(isFiniteCartesian3);

                    if (points.length < 2) return [];
                    const first = points[0];
                    const last = points.at(-1)!;     // 마지막 점

                    // 양끝 점 연결
                    return [last, first];
                },
                false
            );

            try {
                // NOTE 3. 예외처리: 기존 보조선이 남아있다면 제거(중복 추가 방지)
                const circular_line = viewer.entities.getById("circular_line");
                if (circular_line) viewer.entities.remove(circular_line);

                // NOTE 4. 보조 폴리라인 엔티티 추가
                viewer.entities.add({
                    id: "circular_line",
                    polyline: new Cesium.PolylineGraphics({
                        positions: positions,
                        width: 8,
                        material: Cesium.Color.RED.withAlpha(0.3),
                        clampToGround: true,
                    }),
                });

                requestRender()
            } catch {} // 에러 발생 시, 더이상 진행하지 않음
        };

    const removeCircular = ()=>{
        setCircular(false);

        const circular_line = viewer.entities.getById("circular_line");
        if (circular_line) viewer.entities.remove(circular_line);
        viewer.scene.requestRender?.();
    };

    // NOTE 1. 처음 페이지에 들어오면 자동으로 그리기가 활성화된다.
    useEffect(()=>{
        dispatch(resetRouteDrawing())

        // 새 경로 그리기를 시작한다.
        drawer.start({
            type: "POLYLINE",
            once: true, // 한번만 실행
            finalOptions: {
                width: 8,
                material: Cesium.Color.RED,
                clampToGround: true,
            },
            onPointsChange: (points) => { // 경로 제작 반복적으로 실행되는 콜백 함수
                upsertTempRoute(points);
                requestRender() // 실시간 렌더링
            },
            onEnd: (entity) => {
                setTempEntity(entity.id)
                requestRender()
            }
        });
    }, [dispatch, drawer])

    return (
        <>
            <section className={styles.bottomSheet}>
                <div className={styles.drawingController}>
                    <Chip label={"뒤로 가기"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} activable={false} onClickAction={returnPage}/>
                    <Chip label={"운동 가능 시간"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} onClickAction={workoutAvailabilityOnClick}/>
                    <Chip label={"음수대 정보 표시"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} onClickAction={saveDrinkingFountainsInfoOnClick}/>
                    <Chip label={"원형 경로"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} onClickAction={circularRoute}/>
                    <Chip label={"경로 완성"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} activable={false} onClickAction={completeDrawing}/>
                </div>
            </section>

            <div className={styles.routeOptions}>
                <RouteOptionSlider label="거리 제한" value={limitRange} formatValue={formatKm(limitRange)} min={0} max={50} step={0.1} active={limitActive} onSlideAction={setLimitRange} onToggleAction={setLimitActive}/>
                <RouteOptionSlider label="짐 무게" value={luggageWeight} formatValue={formatKg(luggageWeight*1000)} min={0} max={20} step={1} active={luggageActive} onSlideAction={setLuggageWeight} onToggleAction={setLuggageActive}/>
                <RouteOptionSlider label="희망 속도" value={paceSeconds} formatValue={formatPace(paceSeconds)} min={180} max={600} step={5} active={paceActive} onSlideAction={setPaceSeconds} onToggleAction={setPaceActive}/>
            </div>
        </>
    )
}