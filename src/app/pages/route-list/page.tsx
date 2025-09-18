'use client';

import styles from '../../page.module.scss'
import React, {useEffect} from "react";
import {CHIP_TYPE, ChipButton} from "@/app/components/atom/chip/ChipButton";
import {useRouter} from "next/navigation";
import {resetRightSidebar, setRightSidebarOpen} from "@/app/store/redux/feature/rightSidebarSlice";
import {useDispatch} from "react-redux";
import {resetLeftSidebar, setLeftSidebarOpen, setRoutes} from "@/app/store/redux/feature/leftSidebarSlice";
import {Route} from "@/type/route";
import apiClient from "@/api/apiClient";
import {resetRouteDrawing} from "@/app/store/redux/feature/routeDrawingSlice";
import CommonResponse from "@/api/response/common_response";
import {removeMarkers} from "@/app/utils/markers/hideMarkers";
import {getPedestrianRouteMarkers} from "@/app/staticVariables";
import {removePedestrianRoute} from "@/app/pages/route-drawing/utils/drawingTempRoute";

/**
 * 홈 화면을 구현하는 함수
 * @constructor
 */
export default function Page() {
    const dispatch = useDispatch()
    const router = useRouter();

    const userId = 1; // 시연을 위한 하드코딩

    useEffect(() => {
        let alive = true; // 언마운트 대비 (선택)
        (async () => {
            const userRoutes = await getRoutes(userId);
            if (!alive) return;
            dispatch(resetRouteDrawing())
            dispatch(resetRightSidebar())
            dispatch(resetLeftSidebar())
            dispatch(setRoutes(userRoutes));
            dispatch(setLeftSidebarOpen(true));
            dispatch(setRightSidebarOpen(false));
        })();
        return () => { alive = false; };
    }, []);

    return (
        <section className={styles.bottomSheet}>
            <div className={styles.listChips}>
                <ChipButton label={"홈"} type={CHIP_TYPE.CLICK} selectAction={()=> {
                    removeMarkers(getPedestrianRouteMarkers())
                    removePedestrianRoute()
                    dispatch(setRightSidebarOpen(false));
                    dispatch(setLeftSidebarOpen(false));
                    router.push('/')
                }}/> {/* 뒤로가기 */}
            </div>
        </section>
    )
}

async function getRoutes(userId:number) {
    const response = await apiClient.get<CommonResponse<Route[]>>(
        `/api/v1/next_routes/${userId}`,
        { baseURL: process.env.NEXT_PUBLIC_FASTAPI_URL }
    )
    return response.data.data ?? []
}
