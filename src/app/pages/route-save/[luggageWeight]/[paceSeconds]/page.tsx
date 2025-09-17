'use client';

import defaultStyle from '@/app/page.module.scss'
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
import {useModal} from "@/app/store/modal/ModalProvider";
import {postUserRoute} from "@/app/pages/route-save/[luggageWeight]/[paceSeconds]/utils/postUserRoutes";

/**
 * 경로 저장을 그리는 함수
 *
 * @constructor
 */
export default function Page() {
    const viewer = getViewer();
    const dispatch = useDispatch()
    const router = useRouter();
    const { openConfirm, openSave, close } = useModal(); // 모달 여부 // TODO: 필요한가?

    // URL에서 필요한 데이터 얻기
    const { luggageWeight, paceSeconds } = useParams<{ luggageWeight: string; paceSeconds: string }>();

    // 자동 경로 여부를 결정하는 상태값
    const automaticRoute = useSelector((state: RootState) => state.rightSidebar.automaticRoute);
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

    const confirmButton = () => {
        openSave({
            dialogTitle: '경로 저장',
            initialTitle: '잠실 러닝 10K',
            initialDescription: '왕복 10km, 물품보관함 있음',
            initialCategory: '러닝',
            onConfirm: async (title, description, category) => {
                // 1) 불변 업데이트: 새 객체 생성
                const updatedTemp = tempRoute
                    ? { ...tempRoute, title, description }
                    : undefined;

                const updatedPed = pedestrianRoute
                    ? { ...pedestrianRoute, title, description }
                    : undefined;

                // 2) Redux 상태 갱신
                if (updatedTemp) dispatch(setTempRoute(updatedTemp));
                if (updatedPed) dispatch(setPedestrianRoute(updatedPed));

                // 3) 저장할 대상 선택(자동 경로면 tempRoute, 아니면 pedestrianRoute)
                const routeToSave = automaticRoute ? updatedTemp : updatedPed;
                if (!routeToSave) {
                    close(); // 저장할 경로가 없으면 모달만 닫기
                    return;
                }

                // 4) 저장 요청
                await postUserRoute(1, category, routeToSave);

                // 5) 목록으로 이동
                router.replace("/pages/route-list");
            },
        });
    };

    // 1) 보행자 경로 enrich 필요 여부
    function needsEnrich(route?: Route) {
        if (!route) return false;
        return route.sections.some(s => s.pace == null || !s.strategies?.length);
    }

// 2) 얕은 비교로 불필요한 dispatch 차단
    function shallowEqualEnrich(a: Route, b: Route) {
        if (a.sections.length !== b.sections.length) return false;
        for (let i = 0; i < a.sections.length; i++) {
            const sa = a.sections[i], sb = b.sections[i];
            if (sa.pace !== sb.pace) return false;
            if ((sa.strategies?.length || 0) !== (sb.strategies?.length || 0)) return false;
        }
        return true;
    }

    // --- 보행자 경로 ---
    useEffect(() => {
        (async () => {
            if (!pedestrianRoute || !needsEnrich(pedestrianRoute)) return;

            const strategies = await postPaceMaker(
                Number(luggageWeight),
                Number(paceSeconds),
                pedestrianRoute
            );

            const updated: Route = {
                ...pedestrianRoute,
                sections: pedestrianRoute.sections.map((s, i) => ({
                    ...s,
                    pace: strategies[i]?.pace ?? s.pace,
                    strategies: strategies[i]?.strategies ?? s.strategies,
                })),
            };

            if (!shallowEqualEnrich(pedestrianRoute, updated)) {
                dispatch(setPedestrianRoute(updated));
            }
        })();
    }, [pedestrianRoute, luggageWeight, paceSeconds, dispatch]);

    // --- 임시 경로 ---
    useEffect(() => {
        (async () => {
            if (!tempRoute || !needsEnrich(tempRoute)) return;

            const strategies = await postPaceMaker(
                Number(luggageWeight),
                Number(paceSeconds),
                tempRoute
            );

            const updated: Route = {
                ...tempRoute,
                sections: tempRoute.sections.map((s, i) => ({
                    ...s,
                    pace: strategies[i]?.pace ?? s.pace,
                    strategies: strategies[i]?.strategies ?? s.strategies,
                })),
            };

            if (!shallowEqualEnrich(tempRoute, updated)) {
                dispatch(setTempRoute(updated));
            }
        })();
    }, [tempRoute, luggageWeight, paceSeconds, dispatch]);

    // --- 우측 사이드바 오픈: 한 번만 ---
    useEffect(() => {
        dispatch(setRightSidebarOpen(true));
    }, [dispatch]);

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
    }, []);

    const toggleAutomatic = () => {
        const next = !automaticRoute;
        dispatch(setAutomaticRoute(next));

        // 즉시 UI 반영
        hideMarkers(getTempRouteMarkers(), next);
        const tempEntity = viewer.entities.getById(getTempEntity());
        if (tempEntity) tempEntity.show = next;

        hideMarkers(getPedestrianRouteMarkers(), !next);
        const pedestrianEntity = viewer.entities.getById("pedestrian_entity");
        if (pedestrianEntity) pedestrianEntity.show = !next;

        requestRender();
    };

    // 오른쪽 사이드바 확장 상태
    return (
        <>
            <section className={defaultStyle.bottomSheet}>
                <div className={styles.listChips}>
                    <Chip label={"뒤로가기"} activable={false} onClickAction={backButton}/>
                    <Chip label={"자동해제"} activable={false} onClickAction={toggleAutomatic}/>
                    <Chip label={"경로 저장"} activable={false} onClickAction={confirmButton}/>
                </div>
            </section>
        </>
    )
}

async function postPaceMaker(luggageWeight: number, paceSeconds: number, route?: Route) {
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