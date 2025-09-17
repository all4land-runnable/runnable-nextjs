'use client';

import React from "react";
import defaultStyle from '@/app/page.module.scss'
import {Chip} from "@/app/components/atom/chip/Chip";
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
                <Chip label={"경로 생성"} activable={false} onClickAction={() => { router.push("/pages/route-drawing"); }}/>
                <Chip label={"경로 목록"} activable={false} onClickAction={() => { router.push("/pages/route-list"); }}/>
            </div>
        </section>
    )
}
