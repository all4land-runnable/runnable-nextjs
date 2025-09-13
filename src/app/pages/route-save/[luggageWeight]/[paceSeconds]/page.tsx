'use client';

import styles from './page.module.scss'
import React, {useEffect} from "react";
import {getPedestrianRouteMarkers, getTempEntity, getTempRouteMarkers} from "@/app/staticVariables";
import {useDispatch, useSelector} from "react-redux";
import {
    setAutomaticRoute,
    setRightSidebarOpen,
} from "@/app/store/redux/feature/rightSidebarSlice";
import {Chip} from "@/app/components/atom/chip/Chip";
import {RootState} from "@/app/store/redux/store";
import {useParams, useRouter} from "next/navigation";
import hideMarkers, {removeMarkers} from "@/app/utils/markers/hideMarkers";
import requestRender from "@/app/components/organisms/cesium/util/requestRender";
import apiClient from "@/api/apiClient";
import CommonResponse from "@/api/response/common_response";
import {PaceMakerResponse} from "@/type/paceMakerResponse";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";
import {Route} from "@/type/route";
import {setPedestrianRoute, setTempRoute} from "@/app/store/redux/feature/routeDrawingSlice";
import {removePedestrianRoute} from "@/app/pages/route-drawing/utils/drawingTempRoute";
import {getTempPolyline} from "@/app/pages/route-drawing/utils/getTempPolyline";
import {getCircularPolyline} from "@/app/pages/route-drawing/utils/getCircularPolyline";
import {useModal} from "@/app/store/modal/ModalProvider";
import {Entity} from "cesium";
import {parseTempRoute} from "@/app/pages/route-drawing/utils/parseTempRoute";
import {entitiesToLngLat, getPedestrianRoute} from "@/app/pages/route-drawing/utils/postPedestrianRoute";
import {addPedestrianEntity} from "@/app/pages/route-drawing/utils/addPedestrianEntity";
import {parsePedestrianRoute} from "@/app/pages/route-drawing/utils/parsePedestrianRoute";

/**
 * 경로 저장을 그리는 함수
 *
 * @constructor
 */
export default function Page() {
    const viewer = getViewer();
    const dispatch = useDispatch()
    const router = useRouter();
    const { openConfirm, close } = useModal(); // 모달 여부 // TODO: 필요한가?

    // URL에서 필요한 데이터 얻기
    const { luggageWeight, paceSeconds } = useParams<{ luggageWeight: string; paceSeconds: string }>();

    // 자동 경로 여부를 결정하는 상태값
    const automaticRoute = useSelector((state: RootState) => state.rightSideBar.automaticRoute);
    // 임시 경로를 결정하는 상태값
    const tempRoute = useSelector((state:RootState) => state.routeDrawing.tempRoute);
    // 보행자 경로를 결정하는 상태값
    const pedestrianRoute = useSelector((state:RootState) => state.routeDrawing.pedestrianRoute);

    /**
     * 뒤로가기 버튼 onClick
     */
    const backButton = ()=>{
        openConfirm({
            title: "경로 확정 취소", // 제목
            content: "지금까지의 모든 경로가 제거됩니다.", // 본문
            // 확인 버튼 눌렀을 때 수행될 동작 구현
            onConfirm: async ()=>{
                // NOTE 1. 추가한 사용자 경로 엔티티 제거
                // TODO: PedestrianRoute 잔존 정보는 존재한다.
                removePedestrianRoute()

                // NOTE 2. 모든 기존 정보 제거
                viewer.entities.removeById(getTempEntity()); // tempEntity 제거
                viewer.entities.removeById("pedestrian_entity"); // pedestrianEntity 제거
                viewer.entities.removeById("circular_line"); // 원형 경로 보조선 제거
                removeMarkers(getTempRouteMarkers()) // 마커 제거
                removeMarkers(getPedestrianRouteMarkers()) // pedestrianEntity 제거

                // NOTE 3. 우측 사이드바 닫기
                dispatch(setRightSidebarOpen(false));
                router.back();
            },
            onCancel: close
        })
    }

    /**
     * 토글 버튼 onClick
     */
    const toggleAutomatic = () => {
        const next = !automaticRoute;
        dispatch(setAutomaticRoute(next));

        // 다음 상태에 맞춰 즉시 UI 반영
        hideMarkers(getTempRouteMarkers(), next);
        const tempEntity = viewer.entities.getById(getTempEntity());
        if(tempEntity) tempEntity.show = next;

        hideMarkers(getPedestrianRouteMarkers(), !next);
        const pedestrianEntity = viewer.entities.getById("pedestrian_entity");
        if(pedestrianEntity) pedestrianEntity.show = !next;

        requestRender()
    };

    useEffect(() => {
        console.log(1)
        dispatch(setRightSidebarOpen(true));
        console.log(2)
    }, [dispatch]);

    // NOTE 1. 처음 화면 생성 및 onAutomaticRoute 변경 시 동기화
    useEffect(() => {
        (async () => {
            // NOTE 1-1. 보행자 경로의 경로 전략을 갱신하는 함수
            // TODO: 경로 전략이 추가되기 전까지 로딩 화면을 만들기
            if (pedestrianRoute) {
                // NOTE 1-1-1. FastAPI PaceMaker LLM에게 페이스 및 전략 요청
                const pedestrianStrategies = await postPaceMaker(Number(luggageWeight), Number(paceSeconds), pedestrianRoute);

                // NOTE 1-1-1. 기존 PedestrianRoute 갱신
                const updatedPedestrian: Route = { // 기존 PedestrianRoute는 직접적으로 값을 변경하지 못한다. 개로운 객체로 이전하는 로직 구현
                    ...pedestrianRoute,
                    sections: pedestrianRoute.sections.map((section, index) => ({
                        ...section,
                        pace: pedestrianStrategies[index]?.pace ?? section.pace,
                        strategies: pedestrianStrategies[index]?.strategies ?? section.strategies,
                    })),
                };
                // 데이터 갱신하기 TODO: 여기서 값이 갱신되면, 화면 내용도 바뀌게 useEffect 추가하기
                dispatch(setPedestrianRoute(updatedPedestrian));
            }
        })();
    }, [pedestrianRoute]);

    useEffect(() => {
        (async () => {
            // NOTE 1-2. 임시 경로의 경로 전략을 갱신하는 함수
            // TODO: 경로 전략이 추가되기 전까지 로딩 화면을 만들기
            if (tempRoute) {
                // NOTE 1-2-1. FastAPI PaceMaker LLM에게 페이스 및 전략 요청
                const tempStrategies = await postPaceMaker(Number(luggageWeight), Number(paceSeconds), tempRoute);

                // NOTE 1-2-2. 기존 TempRoute 갱신
                const updatedTemp: Route = {
                    ...tempRoute,
                    sections: tempRoute.sections.map((section, index) => ({
                        ...section,
                        pace: tempStrategies[index]?.pace ?? section.pace,
                        strategies: tempStrategies[index]?.strategies ?? section.strategies,
                    })),
                };
                // 데이터 갱신하기 TODO: 여기서 값이 갱신되면, 화면 내용도 바뀌게 useEffect 추가하기
                dispatch(setTempRoute(updatedTemp));
            }
        })();
    }, [tempRoute]);

    // NOTE 2. 자동 경로 상태가 바뀌는 경우 수행
    useEffect(() => {
        // NOTE 2-1. 자동해제 동작 수행
        hideMarkers(getTempRouteMarkers(), automaticRoute);

        // 임시 경로가 보이게 한다.
        const tempEntity = viewer.entities.getById(getTempEntity());
        if(tempEntity) tempEntity.show = automaticRoute;

        // 보행자 경로가 보이게 한다.
        const pedestrianEntity = viewer.entities.getById("pedestrian_entity");
        if(pedestrianEntity) pedestrianEntity.show = !automaticRoute;

        requestRender()
    }, [automaticRoute]);

    // 오른쪽 사이드바 확장 상태
    return (
        <>
            <section className={styles.bottomSheet}>
                <div className={styles.listChips}>
                    <Chip label={"뒤로가기"} activable={false} onClickAction={backButton}/>
                    <Chip label={"자동해제"} activable={false} onClickAction={toggleAutomatic}/>
                    <Chip label={"경로 저장"} activable={false} onClickAction={()=>{alert("경로를 저장하시겠습니까")}}/>
                </div>
            </section>
        </>
    )
}

async function postPaceMaker(luggageWeight: number, paceSeconds: number, route?: Route) {
    console.log("luggageWeight", luggageWeight);
    console.log("paceSeconds", paceSeconds);
    if (!route) return []; // 안전 가드
    const response = await apiClient.post<CommonResponse<PaceMakerResponse>>(
        '/api/v1/pace_maker',
        {
            luggageWeight: 0,
            paceSeconds: 420,
            sections: route.sections.map(section => ({
                luggageWeight:luggageWeight==0?null:luggageWeight,
                paceSeconds:paceSeconds==0?null:paceSeconds,
                distance: section.distance,
                slope: section.slope,
                startPlace: section.startPlace,
            })),
        },
        { baseURL: process.env.NEXT_PUBLIC_FASTAPI_URL }
    );
    const body = response.data;
    if (!body || !body.data) throw new Error('routeResponse returned from route');
    return body.data;
}