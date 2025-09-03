'use client';

import styles from '../../page.module.css'
import React from "react";
import RightSideBar from "@/app/components/templates/right-side-bar/RightSideBar";
import DrawingController from "@/app/components/molecules/drawing-controller/DrawingController";

/**
 * 홈 화면을 구현하는 함수
 * @constructor
 */
export default function Page() {
    // 오른쪽 사이드바 확장 상태
    const [openRightSideBar, setOpenRightSideBar] = React.useState(true);


    return (
        <>
            <div className={styles.onViewer}>
                {/* 오른쪽 사이드 바 */}
                <RightSideBar rightSideBarState={{openRightSideBar: openRightSideBar, setOpenRightSideBar: setOpenRightSideBar}}/>
            </div>

            <section className={styles.bottomSheet}>
                <DrawingController/>
            </section>
        </>
    )
}
