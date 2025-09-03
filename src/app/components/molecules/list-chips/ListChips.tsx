import {useRouter} from "next/navigation";
import {Chip, ChipParam} from "@/app/components/atom/chip/Chip";
import {remToPx} from "@/app/utils/claculator/pxToRem";
import styles from './ListChips.module.css'
import React from "react";

export default function ListChips() {
    const router = useRouter();

    // chip 버튼 속성 선언
    const homeRoute: ChipParam = {label:"홈", backgroundColor:"#FF9F9F", fontSize:remToPx(1.125), toggle:false, onClick:()=> { router.push('/') }}

    return (
        <div className={styles.listChips}>
            <Chip chipParam={homeRoute}/> {/* 뒤로가기 */}
        </div>
    )
}