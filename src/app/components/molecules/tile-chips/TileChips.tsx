'use client';

import styles from "./TileChips.module.css";
import React from "react";
import { Chip } from "@/app/components/atom/chip/Chip";
import altitudeOnClick from "@/app/components/molecules/tile-chips/title-onclick/altitudeOnClick";
import { remToPx } from "@/app/utils/claculator/pxToRem";

/**
 * 타일 버튼을 구현하는 함수
 */
export default function TileChips() {


    return (
        <div className={styles.tileChips}>
            <Chip label="고도 표시" backgroundColor="#FCDE8C" fontSize={remToPx(1.125)} onClickAction={altitudeOnClick}/>
            <Chip label="재질 표시" backgroundColor="#FCDE8C" fontSize={remToPx(1.125)} onClickAction={async () => {}}/> {/* TODO: 재질 표시 로직 */}
            <Chip label="온도 측정" backgroundColor="#FCDE8C" fontSize={remToPx(1.125)} onClickAction={async () => {}}/> {/* TODO: 온도 측정 로직 */}
        </div>
    );
}
