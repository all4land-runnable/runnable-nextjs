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
    setPedestrianRoute,
    setTempRoute
} from "@/app/store/redux/feature/rightSidebarSlice";
import {buildRouteFromEntity} from "@/app/utils/buildRouteFromEntity";
import {Chip} from "@/app/components/atom/chip/Chip";
import {remToPx} from "@/app/utils/claculator/pxToRem";
import {RootState} from "@/app/store/redux/store";
import {useRouter} from "next/navigation";
import hideMarkers from "@/app/utils/markers/hideMarkers";
import {setTempRouteVisibility} from "@/app/utils/drawing-chips/drawing/drawingTempRoute";
import {setCircularVisibility} from "@/app/utils/drawing-chips/drawing-controller-onclick/circularRouteOnClick";
import {removePedestrianRoute} from "@/app/utils/drawing-chips/drawing-controller-onclick/completeDrawingOnClick";
import requestRender from "@/app/components/organisms/cesium/util/requestRender";
import apiClient from "@/api/apiClient";
import CommonResponse from "@/api/response/common_response";
import {PaceMakerResponse} from "@/type/paceMakerResponse";

/**
 * 홈 화면을 구현하는 함수
 * @constructor
 */
export default function Page() {
    const dispatch = useDispatch()
    const pedestrianRoute = useSelector((state: RootState)=> state.rightSideBar.pedestrianRoute);


    const automaticRoute = useSelector((state: RootState) => state.rightSideBar.automaticRoute);

    const router = useRouter();

    // NOTE 1. 처음 화면 생성 및 onAutomaticRoute 변경 시 동기화
    useEffect(() => {
        const on = automaticRoute;
        hideMarkers(getTempRouteMarkers(), on);
        setTempRouteVisibility(on);
        setCircularVisibility(on);
        setPedestrianRouteVisibility(!on);
    }, [automaticRoute]);

    const backButton = ()=>{
        removePedestrianRoute();
        dispatch(setRightSidebarOpen(false));
        router.back();
    }

    // 클릭 시 즉시 반영(다음 상태 기준)
    const toggleAutomatic = () => {
        const next = !automaticRoute;
        dispatch(setAutomaticRoute(next));

        // 다음 상태에 맞춰 즉시 UI 반영
        hideMarkers(getTempRouteMarkers(), next);
        setTempRouteVisibility(next);
        setCircularVisibility(next);
        setPedestrianRouteVisibility(!next);
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

    // NOTE 1. 처음 화면 생성 시 작동
    useEffect(()=>{
        const pedestrianEntity = getPedestrianEntity()
        buildRouteFromEntity(pedestrianEntity).then((route)=> {
            dispatch(setPedestrianRoute(route));
        });

        const tempEntity = getTempEntity()
        buildRouteFromEntity(tempEntity).then((route) => {
            dispatch(setTempRoute(route))
        }).catch(console.error);
    }, [dispatch])

    useEffect(()=>{
        // TODO: 섹션 별 페이스 요청 API
        apiClient.post<CommonResponse<PaceMakerResponse>>('/api/v1/pace_maker',{
            luggageWeight: 0,
            paceSeconds: 420,
            route: {
                sections: pedestrianRoute.sections.map(s => ({
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

            const paceMaker = paceMakerResponse.data
            paceMaker.forEach((section)=>{
                console.log(section.pace)
                // TODO: 여기서 수정하기 (데이터를 네번 전공하는데 이유가 뭔지 아직 잘 모름 useEffect가 원인으로 추정)
            })
        })

        dispatch(openWithData({
            sectionStrategies:sectionStrategies,
            routeRankingParams:routeRankingParams
        }))
    },[dispatch, routeRankingParams, sectionStrategies, pedestrianRoute.sections])

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

/**
 * newRoute(pedestrianRoute)의 가시성을 제어한다.
 * @param visible true면 보이게, false면 숨김
 */
export function setPedestrianRouteVisibility(visible: boolean) {
    const pedestrianRoute = getPedestrianEntity();
    pedestrianRoute.show = visible;
    requestRender();
}
