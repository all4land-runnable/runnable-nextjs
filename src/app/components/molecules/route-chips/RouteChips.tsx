import React from "react";
import styles from "./RouteChips.module.css";
import {remToPx} from "@/app/utils/claculator/pxToRem";
import {Chip, ChipParam} from "@/app/components/atom/chip/Chip";
import {useRouter} from "next/navigation";

/**
 * 경로 관련 버튼을 구현하는 함수
 * @constructor
 */
export default function RouteChips() {
    const router = useRouter();

    // chip 버튼 속성 선언
    const createRoute: ChipParam = {label:"경로 생성", backgroundColor:"#FF9F9F", fontSize:remToPx(1.125), toggle:false, onClick:()=> { router.push('/pages/route-drawing') }}
    const routeList: ChipParam = {label:"경로 목록", backgroundColor:"#FF9F9F", fontSize:remToPx(1.125), onClick:()=> { router.push('/pages/route-list') }}

    return (
        <div className={styles.routeChips}>
            <Chip chipParam={createRoute}/> {/* 경로 생성 */}
            <Chip chipParam={routeList}/> {/* 경로 목록 */}
        </div>
    )
}