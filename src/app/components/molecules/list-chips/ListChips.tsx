import {useRouter} from "next/navigation";
import {Chip} from "@/app/components/atom/chip/Chip";
import {remToPx} from "@/app/utils/claculator/pxToRem";
import styles from './ListChips.module.css'
import React from "react";

export default function ListChips() {
    const router = useRouter();

    return (
        <div className={styles.listChips}>
            <Chip label={"홈"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} activable={false} onClickAction={()=> { router.push('/') }}/> {/* 뒤로가기 */}
        </div>
    )
}