'use client';

import styles from './page.module.css'
import React, {useEffect} from "react";
import {SectionStrategyParam} from "@/app/components/molecules/pace-strategy/PaceStrategy";
import {getTempEntity, getTempRouteMarkers} from "@/app/staticVariables";
import {useDispatch, useSelector} from "react-redux";
import {
    openWithData,
    setAutomaticRoute,
    setRightSidebarOpen,
} from "@/app/store/redux/feature/rightSidebarSlice";
import {Chip} from "@/app/components/atom/chip/Chip";
import {remToPx} from "@/app/utils/claculator/pxToRem";
import {RootState} from "@/app/store/redux/store";
import {useRouter} from "next/navigation";
import hideMarkers from "@/app/utils/markers/hideMarkers";
import requestRender from "@/app/components/organisms/cesium/util/requestRender";
import apiClient from "@/api/apiClient";
import CommonResponse from "@/api/response/common_response";
import {PaceMakerResponse} from "@/type/paceMakerResponse";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";
import {Route} from "@/type/route";
import {setPedestrianRoute, setTempRoute} from "@/app/store/redux/feature/routeDrawingSlice";
import {removePedestrianRoute} from "@/app/pages/route-drawing/utils/drawingTempRoute";

/**
 * 홈 화면을 구현하는 함수
 * @constructor
 */
export default function Page() {
    const viewer = getViewer();
    const dispatch = useDispatch()
    const router = useRouter();

    const automaticRoute = useSelector((state: RootState) => state.rightSideBar.automaticRoute);
    const tempRoute = useSelector((state:RootState) => state.routeDrawing.tempRoute);
    const pedestrianRoute = useSelector((state:RootState) => state.routeDrawing.pedestrianRoute);

    const backButton = ()=>{
        removePedestrianRoute()
        dispatch(setRightSidebarOpen(false));
        router.back();
    }

    // 클릭 시 즉시 반영(다음 상태 기준)
    const toggleAutomatic = () => {
        const next = !automaticRoute;
        dispatch(setAutomaticRoute(next));

        // 다음 상태에 맞춰 즉시 UI 반영
        hideMarkers(getTempRouteMarkers(), next);
        const tempEntity = viewer.entities.getById(getTempEntity());
        if(tempEntity) tempEntity.show = next;

        const pedestrianEntity = viewer.entities.getById("pedestrian_entity");
        if(pedestrianEntity) pedestrianEntity.show = !next;

        requestRender()
    };

    // NOTE 1. 처음 화면 생성 및 onAutomaticRoute 변경 시 동기화
    useEffect(() => {
        // route가 없으면 아무 것도 안 함
        if (!pedestrianRoute && !tempRoute) return;

        let canceled = false;

        (async () => {
            if (pedestrianRoute) {
                const pedestrianStrategies = await postPaceMaker(pedestrianRoute);
                if (canceled) return;
                const updatedPedestrian: Route = {
                    ...pedestrianRoute,
                    sections: pedestrianRoute.sections.map((section, index) => ({
                        ...section,
                        pace: pedestrianStrategies[index]?.pace ?? section.pace,
                        strategies: pedestrianStrategies[index]?.strategies ?? section.strategies,
                    })),
                };
                dispatch(setPedestrianRoute(updatedPedestrian));
            }

            if (tempRoute) {
                const tempStrategies = await postPaceMaker(tempRoute);
                if (canceled) return;
                const updatedTemp: Route = {
                    ...tempRoute,
                    sections: tempRoute.sections.map((section, index) => ({
                        ...section,
                        pace: tempStrategies[index]?.pace ?? section.pace,
                        strategies: tempStrategies[index]?.strategies ?? section.strategies,
                    })),
                };
                dispatch(setTempRoute(updatedTemp));
            }
        })();

        return () => {
            canceled = true; // 늦게 도착한 응답 무시
        };
    }, [dispatch, pedestrianRoute, tempRoute]);


    useEffect(() => {
        const sourceSections =
            (automaticRoute ? tempRoute?.sections : pedestrianRoute?.sections) ?? [];

        const sectionStrategies: SectionStrategyParam[] = sourceSections.map(section => ({
            distance: section.distance,
            startPlace: section.startPlace,
            strategies: section.strategies,
        }));

        dispatch(openWithData({ sectionStrategies }));
    }, [automaticRoute, dispatch, pedestrianRoute, tempRoute]);

    // NOTE 2. 자동해제 동작 수행
    useEffect(() => {
        const on = automaticRoute;
        hideMarkers(getTempRouteMarkers(), on);

        const tempEntity = viewer.entities.getById(getTempEntity());
        if(tempEntity) tempEntity.show = on;

        const pedestrianEntity = viewer.entities.getById("pedestrian_entity");
        if(pedestrianEntity) pedestrianEntity.show = !on;

        requestRender()
    }, [automaticRoute, viewer.entities]);

    // 오른쪽 사이드바 확장 상태
    return (
        <>
            <section className={styles.bottomSheet}>
                <div className={styles.listChips}>
                    <Chip label={"뒤로가기"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} activable={false} onClickAction={backButton}/>
                    <Chip label={"자동해제"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} activable={false} onClickAction={toggleAutomatic}/>
                    <Chip label={"경로 저장"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} activable={false} onClickAction={()=>{alert("경로를 저장하시겠습니까")}}/>
                </div>
            </section>
        </>
    )
}

let counter = 0

async function postPaceMaker(route?: Route) {
    if (!route) return []; // 안전 가드
    console.log(counter++);
    const response = await apiClient.post<CommonResponse<PaceMakerResponse>>(
        '/api/v1/pace_maker',
        {
            luggageWeight: 0,
            paceSeconds: 420,
            sections: route.sections.map(s => ({
                distance: s.distance,
                slope: s.slope,
                startPlace: s.startPlace,
            })),
        },
        { baseURL: process.env.NEXT_PUBLIC_FASTAPI_URL }
    );
    const body = response.data;
    if (!body || !body.data) throw new Error('routeResponse returned from route');
    return body.data;
}