'use client';

import { useRouter } from "next/navigation";
import { Chip } from "@/app/components/atom/chip/Chip";
import { remToPx } from "@/app/utils/claculator/pxToRem";
import styles from './SaveChips.module.css'
import React, { useEffect } from "react";

import hideMarkers from "@/app/utils/markers/hideMarkers";
import { getPedestrianRoute, getTempRouteMarkers } from "@/app/staticVariables";
import {setTempRouteVisibility} from "@/app/utils/drawing-chips/drawing/drawingTempRoute";
import {setCircularVisibility} from "@/app/utils/drawing-chips/drawing-controller-onclick/circularRouteOnClick";
import {removePedestrianRoute} from "@/app/utils/drawing-chips/drawing-controller-onclick/completeDrawingOnClick";
import requestRender from "@/app/components/organisms/cesium/util/requestRender";

export type AutomaticRouteState = {
    onAutomaticRoute: boolean;
    setOnAutomaticRoute: (onAutomaticRoute: boolean) => void;
};

type SaveChipsProp = {
    automaticRouteState: AutomaticRouteState;
};

export default function SaveChips({ automaticRouteState }: SaveChipsProp) {
    const router = useRouter();

    // NOTE 1. 처음 화면 생성 및 onAutomaticRoute 변경 시 동기화
    useEffect(() => {
        const on = automaticRouteState.onAutomaticRoute;
        hideMarkers(getTempRouteMarkers(), on);
        setTempRouteVisibility(on);
        setCircularVisibility(on);
        setPedestrianRouteVisibility(!on);
    }, [automaticRouteState.onAutomaticRoute]);

    const backButton = ()=>{
        removePedestrianRoute();
        router.back();
    }

    // 클릭 시 즉시 반영(다음 상태 기준)
    const toggleAutomatic = () => {
        const next = !automaticRouteState.onAutomaticRoute;
        automaticRouteState.setOnAutomaticRoute(next);

        // 다음 상태에 맞춰 즉시 UI 반영
        hideMarkers(getTempRouteMarkers(), next);
        setTempRouteVisibility(next);
        setCircularVisibility(next);
        setPedestrianRouteVisibility(!next);};

    return (
        <div className={styles.listChips}>
            <Chip label={"뒤로가기"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} activable={false} onClickAction={backButton}/>
            <Chip label={"자동해제"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} activable={false} onClickAction={toggleAutomatic}/>
        </div>
    );
}

/**
 * newRoute(pedestrianRoute)의 가시성을 제어한다.
 * @param visible true면 보이게, false면 숨김
 */
export function setPedestrianRouteVisibility(visible: boolean) {
    const pedestrianRoute = getPedestrianRoute();
    pedestrianRoute.show = visible;
    requestRender();
}
