import {useRouter} from "next/navigation";
import {Chip, ChipParam} from "@/app/components/atom/chip/Chip";
import {remToPx} from "@/app/utils/claculator/pxToRem";
import styles from './SaveChips.module.css'
import React, {useEffect, useRef} from "react";

import hideMarkers from "@/app/utils/markers/hideMarkers";
import {drawMarkerEntities} from "@/app/staticVariables";
import {setDrawPolylineVisibility} from "@/app/components/molecules/drawing-chips/drawing/drawingRoute";
import {
    removeNewRoute, setNewRouteVisibility
} from "@/app/components/molecules/drawing-chips/drawing-controller-onclick/completeDrawingOnClick";

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
        removeNewRoute();
        router.back();
    }};
    const automaticRoute: ChipParam = {label: "자동해제", backgroundColor:"#FF9F9F", fontSize:remToPx(1.125), onClick:()=> {
        automaticRouteState.setOnAutomaticRoute(!automaticRouteState.onAutomaticRoute);

        hideMarkers(drawMarkerEntities, !automaticRouteState.onAutomaticRoute);
        setDrawPolylineVisibility(!automaticRouteState.onAutomaticRoute)
        setNewRouteVisibility(automaticRouteState.onAutomaticRoute);
    }};

    // NOTE 1. 처음 화면 생성 시 작동
    const initializedRef = useRef(false);
    useEffect(()=>{
        if (initializedRef.current) return;
        initializedRef.current = true;

        hideMarkers(drawMarkerEntities, automaticRouteState.onAutomaticRoute);
        setDrawPolylineVisibility(automaticRouteState.onAutomaticRoute)
        setNewRouteVisibility(!automaticRouteState.onAutomaticRoute);
    }, [automaticRouteState.onAutomaticRoute])

    return (
        <div className={styles.listChips}>
            <Chip chipParam={backButton}/> {/* 뒤로가기 */}
            <Chip chipParam={automaticRoute}/>
        </div>
    )
}