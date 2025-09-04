import {useRouter} from "next/navigation";
import {Chip, ChipParam} from "@/app/components/atom/chip/Chip";
import {remToPx} from "@/app/utils/claculator/pxToRem";
import styles from './SaveChips.module.css'
import React, {useEffect} from "react";

import hideMarkers from "@/app/utils/markers/hideMarkers";
import {setTempRouteVisibility} from "@/app/components/molecules/drawing-chips/drawing/drawingTempRoute";
import {removePedestrianRoute} from "@/app/components/molecules/drawing-chips/drawing-controller-onclick/completeDrawingOnClick";
import {getPedestrianRoute, getTempRouteMarkers} from "@/app/staticVariables";
import requestRender from "../../templates/cesium/util/requestRender";
import {
    setCircularVisibility
} from "@/app/components/molecules/drawing-chips/drawing-controller-onclick/circularRouteOnClick";

export type AutomaticRouteState = {
    onAutomaticRoute: boolean;
    setOnAutomaticRoute: (onAutomaticRoute: boolean)=> void;
}

type SaveChipsProp = {
    automaticRouteState: AutomaticRouteState;
}

export default function SaveChips({automaticRouteState}: SaveChipsProp) {
    const router = useRouter();

    // chip 버튼 속성 선언
    const backButton: ChipParam = {label:"뒤로가기", backgroundColor:"#FF9F9F", fontSize:remToPx(1.125), toggle:false, onClick:()=> {
        removePedestrianRoute();
        router.back();
    }};
    const automaticRoute: ChipParam = {label: "자동해제", backgroundColor:"#FF9F9F", fontSize:remToPx(1.125), onClick:()=> {
        automaticRouteState.setOnAutomaticRoute(!automaticRouteState.onAutomaticRoute);

        hideMarkers(getTempRouteMarkers(), !automaticRouteState.onAutomaticRoute);
        setTempRouteVisibility(!automaticRouteState.onAutomaticRoute)
        setCircularVisibility(!automaticRouteState.onAutomaticRoute)
        setPedestrianRouteVisibility(automaticRouteState.onAutomaticRoute);
    }};

    // NOTE 1. 처음 화면 생성 시 작동
    useEffect(()=>{
        hideMarkers(getTempRouteMarkers(), automaticRouteState.onAutomaticRoute);
        setTempRouteVisibility(automaticRouteState.onAutomaticRoute)
        setCircularVisibility(automaticRouteState.onAutomaticRoute)
        setPedestrianRouteVisibility(!automaticRouteState.onAutomaticRoute);
    }, [automaticRouteState.onAutomaticRoute])

    return (
        <div className={styles.listChips}>
            <Chip chipParam={backButton}/> {/* 뒤로가기 */}
            <Chip chipParam={automaticRoute}/>
        </div>
    )
}

/**
 * newRoute(pedestrianRoute)의 가시성을 제어한다.
 * @param visible true면 보이게, false면 숨김
 */
export function setPedestrianRouteVisibility(visible: boolean) {
    const pedestrianRoute = getPedestrianRoute();

    pedestrianRoute.show = visible;
    requestRender()
}