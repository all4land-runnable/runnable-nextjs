'use client';

import React from "react";
import defaultStyle from '@/app/page.module.scss'
import {CHIP_TYPE, ChipButton} from "@/app/components/atom/chip/ChipButton";
import {useRouter} from "next/navigation";

/**
 * 홈 화면을 구현하는 함수
 * @constructor
 */
export default function Page() {
    const router = useRouter();

    return (
        <section className={defaultStyle.bottomSheet}>
            {/* 경로 관련 버튼 모음 */}
            <div className={defaultStyle.routeChips}>
                <ChipButton label={"경로 생성"} type={CHIP_TYPE.CLICK} selectAction={() => { router.push("/pages/route-drawing"); }}/>
                <ChipButton label={"경로 목록"} type={CHIP_TYPE.CLICK} selectAction={() => { router.push("/pages/route-list"); }}/>
            </div>
        </section>
    )
}
