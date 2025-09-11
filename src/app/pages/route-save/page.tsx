'use client';

import styles from './page.module.css'
import React, {useEffect} from "react";
import {SectionStrategyParam} from "@/app/components/molecules/pace-strategy/PaceStrategy";
import {RouteRankingParam} from "@/app/components/molecules/route-ranking/RouteRanking";
import {getPedestrianEntity, getTempEntity, getTempRouteMarkers} from "@/app/staticVariables";
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

/**
 * 홈 화면을 구현하는 함수
 * @constructor
 */
export default function Page() {
    const viewer = getViewer();
    const dispatch = useDispatch()

    const tempRoute = useSelector((state:RootState) => state.routeDrawing.tempRoute);
    const pedestrianRoute = useSelector((state:RootState) => state.routeDrawing.pedestrianRoute);

    const automaticRoute = useSelector((state: RootState) => state.rightSideBar.automaticRoute);

    const router = useRouter();

    const backButton = ()=>{
        viewer.entities.removeById("pedestrian_entity")
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

    // NOTE: 샘플 구간 전략 속성
    const sectionStrategies: SectionStrategyParam[] = [
        { startPlace: '여의도 공원 입구', strategies: ['페이스를 유지해 주세요!'] },
        { startPlace: '마포대교 사거리', strategies: ["매우 가파른 경사입니다. 7'20'페이스를 유지하세요!","주변에 음수대가 있습니다. 수분을 보충할 수 있습니다."] },
    ];

    // NOTE: 샘플 경로 랭킹 속성
    const routeRankingParams: RouteRankingParam[] = [
        { name: '김명민', rank: 1, pace: 21800 },
        { name: '김명준', rank: 2, pace: 22800 }
    ]

    // NOTE 1. 처음 화면 생성 및 onAutomaticRoute 변경 시 동기화
    useEffect(()=>{
        // TODO: 섹션 별 페이스 요청 API
        // const pedestrianStrategies = postPaceMaker(pedestrianRoute)
        // const tempStrategies = postPaceMaker(tempRoute)

        dispatch(openWithData({
            sectionStrategies:sectionStrategies,
            routeRankingParams:routeRankingParams
        }))
    },[])

    // NOTE 2. 자동해제 동작 수행
    useEffect(() => {
        const on = automaticRoute;
        hideMarkers(getTempRouteMarkers(), on);

        const tempEntity = viewer.entities.getById(getTempEntity());
        if(tempEntity) tempEntity.show = on;

        const pedestrianEntity = viewer.entities.getById("pedestrian_entity");
        if(pedestrianEntity) pedestrianEntity.show = !on;

        requestRender()
    }, [automaticRoute]);

    // 오른쪽 사이드바 확장 상태
    return (
        <>
            <section className={styles.bottomSheet}>
                <div className={styles.listChips}>
                    <Chip label={"뒤로가기"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} activable={false} onClickAction={backButton}/>
                    <Chip label={"자동해제"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} activable={false} onClickAction={toggleAutomatic}/>
                </div>
            </section>
        </>
    )
}

function postPaceMaker(route: Route){
    return apiClient.post<CommonResponse<PaceMakerResponse>>('/api/v1/pace_maker',{
        luggageWeight: 0,
        paceSeconds: 420,
        route: {
            sections: route.sections.map(s => ({
                distance: s.distance,
                slope: s.slope,
            })),
        },
    }, {
        baseURL: process.env.NEXT_PUBLIC_FASTAPI_URL,
    }).then((response)=>{
        const paceMakerResponse: CommonResponse<PaceMakerResponse> = response.data;

        if(!paceMakerResponse || !paceMakerResponse.data)
            throw new Error("routeResponse returned from route")

        return paceMakerResponse.data
    })
}