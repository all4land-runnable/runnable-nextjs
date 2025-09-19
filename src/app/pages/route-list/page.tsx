'use client';

import styles from '../../page.module.scss'
import React, {useEffect} from "react";
import {CHIP_TYPE, ChipButton} from "@/app/components/atom/ChipButton";
import {useRouter} from "next/navigation";
import {resetRightSidebar, setRightSidebarOpen} from "@/app/store/redux/feature/rightSidebarSlice";
import {useDispatch} from "react-redux";
import {setLeftSidebarOpen} from "@/app/store/redux/feature/leftSidebarSlice";
import {resetRouteDrawing} from "@/app/store/redux/feature/routeDrawingSlice";
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

    useEffect(() => {
        let alive = true; // 언마운트 대비 (선택)
        (async () => {
            if (!alive) return;
            dispatch(resetRouteDrawing())
            dispatch(resetRightSidebar())

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