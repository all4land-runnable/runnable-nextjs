'use client';

import React from "react";
import styles from '../../page.module.css'
import TileChips from "@/app/components/molecules/tile-chips/TileChips";
import EmphasizeChips from "@/app/components/molecules/emphasize-chips/EmphasizeChips";
import DrawingChips from "@/app/components/molecules/drawing-chips/DrawingChips";

/**
 * 홈 화면을 구현하는 함수
 * @constructor
 */
export default function Page() {
    return (
        <>
            <div className={styles.onViewer}>
                <div className={styles.topSheet}>
                    <EmphasizeChips/> {/* 구역 강조 버튼 모음 */}
                    <TileChips/> {/* 타일 버튼 모음 */}
                </div>
            </div>

            <section className={styles.bottomSheet}>
                <DrawingChips/>
            </section>
        </>
    )
}
