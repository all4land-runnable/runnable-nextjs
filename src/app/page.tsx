'use client';

import React from "react";
import styles from './page.module.scss'
import {Chip} from "@/app/components/atom/chip/Chip";
import {remToPx} from "@/app/utils/claculator/pxToRem";
import {useRouter} from "next/navigation";

/**
 * 홈 화면을 구현하는 함수
 * @constructor
 */
export default function Page() {
    const router = useRouter();

    return (
        <section className={styles.bottomSheet}>
            {/* 경로 관련 버튼 모음 */}
            <div className={styles.routeChips}>
                <Chip label={"경로 생성"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} activable={false} onClickAction={() => { router.push("/pages/route-drawing"); }}/>
                <Chip label={"경로 목록"} backgroundColor={"#FF9F9F"} fontSize={remToPx(1.125)} activable={false} onClickAction={() => { router.push("/pages/route-list"); }}/>
            </div>
        </section>
    )
}
