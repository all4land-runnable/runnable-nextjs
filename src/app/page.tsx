'use client';

import styles from './page.module.css'
import React from "react";
import CesiumWrapper from "@/app/components/templates/cesium/CesiumWrapper";
import LeftSideBar from "@/app/components/templates/left-side-bar/LeftSideBar";
import EmphasizeChips from "@/app/components/molecules/emphasize-chips/EmphasizeChips";
import TileChips from "@/app/components/molecules/tile-chips/TileChips";
import RightSideBar from "@/app/components/templates/right-side-bar/RightSideBar";
import RouteChips from "@/app/components/molecules/route-chips/RouteChips";

/**
 * 홈 화면을 구현하는 함수
 * @constructor
 */
export default function Page() {
    // 왼쪽 사이드바 확장 상태
    const [openLeftSideBar, setOpenLeftSideBar] = React.useState(false);

    // 오른쪽 사이드바 확장 상태
    const [openRightSideBar, setOpenRightSideBar] = React.useState(false);

    return (
        <article>
            <section className={styles.cesium}>
                <CesiumWrapper/> {/* cesium viewer */}
            </section>

            <div className={styles.onViewer}>
                {/* 왼쪽 사이드 바 */}
                <LeftSideBar leftSideBarState={{openLeftSideBar: openLeftSideBar, setOpenLeftSideBar: setOpenLeftSideBar}} rightSideBarState={{openRightSideBar: openRightSideBar, setOpenRightSideBar: setOpenRightSideBar}}/>
                <div className={styles.topSheet}>
                    <EmphasizeChips/> {/* 구역 강조 버튼 모음 */}
                    <TileChips/> {/* 타일 버튼 모음 */}
                </div>
                {/* 오른쪽 사이드 바 */}
                <RightSideBar rightSideBarState={{openRightSideBar: openRightSideBar, setOpenRightSideBar: setOpenRightSideBar}}/>
            </div>

            <section className={styles.bottomSheet}>
                {/* 경로 관련 버튼 모음 */}
                <RouteChips leftSideBarState={{openLeftSideBar: openLeftSideBar, setOpenLeftSideBar: setOpenLeftSideBar}}/>
            </section>
        </article>
    )
}
