'use client';

import styles from '../../page.module.css'
import React from "react";
import LeftSideBar from "@/app/components/templates/left-side-bar/LeftSideBar";
import EmphasizeChips from "@/app/components/molecules/emphasize-chips/EmphasizeChips";
import TileChips from "@/app/components/molecules/tile-chips/TileChips";
import RightSideBar from "@/app/components/templates/right-side-bar/RightSideBar";
import {useRouter} from "next/navigation";
import {Chip, ChipParam} from "@/app/components/atom/chip/Chip";
import {remToPx} from "@/app/utils/claculator/pxToRem";

/**
 * 홈 화면을 구현하는 함수
 * @constructor
 */
export default function Page() {
    const router = useRouter();
    const [openRightSideBar, setOpenRightSideBar] = React.useState(false); // 오른쪽 사이드바 확장 상태

    const homeRoute: ChipParam = {label:"홈", backgroundColor:"#FF9F9F", fontSize:remToPx(1.125), toggle:false, onClick:()=> { router.push('/') }}

    return (
        <>
            <div className={styles.onViewer}>
                {/* 왼쪽 사이드 바 */}
                <LeftSideBar rightSideBarState={{openRightSideBar: openRightSideBar, setOpenRightSideBar: setOpenRightSideBar}}/>
                <div className={styles.topSheet}>
                    <EmphasizeChips/> {/* 구역 강조 버튼 모음 */}
                    <TileChips/> {/* 타일 버튼 모음 */}
                </div>
                {/* 오른쪽 사이드 바 */}
                {openRightSideBar??<RightSideBar/>}
            </div>

            <section className={styles.bottomSheet}>
                <Chip chipParam={homeRoute}/>
            </section>
        </>
    )
}
