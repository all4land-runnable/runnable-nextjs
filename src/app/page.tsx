'use client';

import CesiumWrapper from '@/app/components/cesium/CesiumWrapper'
import Chip, {ChipData} from '@/app/components/chip/Chip'
import LeftSideBar from "@/app/left-side-bar/LeftSideBar";
import RightSideBar from "@/app/right-side-bar/RightSideBar";
import styles from './page.module.css'
import {remToPx} from "@/app/utils/pxToRem";
import React from "react";

export default function Page() {
    const [openLeftSideBar, setOpenLeftSideBar] = React.useState(false);
    const [openRightSideBar, setOpenRightSideBar] = React.useState(false);

    const popularCourse:ChipData = {label:"인기 코스", backgroundColor:"#A1F0CB", fontSize:remToPx(1.125), onClick:()=>{
            alert("개발중: 인기 코스 데이터가 없습니다.");
        }};
    const crosswalk:ChipData = {label:"횡단보도", backgroundColor:"#A1F0CB", fontSize:remToPx(1.125), onClick:()=>{}};
    const sidewalk:ChipData = {label:"도보 경로", backgroundColor:"#A1F0CB", fontSize:remToPx(1.125), onClick:()=>{}};
    const storageBox:ChipData = {label:"물품보관함", backgroundColor:"#A1F0CB", fontSize:remToPx(1.125), onClick:()=>{}};
    const hospital:ChipData = {label:"병원", backgroundColor:"#A1F0CB", fontSize:remToPx(1.125), onClick:()=>{}};
    const drinkingFountain:ChipData = {label:"음수대", backgroundColor:"#A1F0CB", fontSize:remToPx(1.125), onClick:()=>{}};

    const altitude: ChipData = {label:"고도 표시", backgroundColor:"#FCDE8C", fontSize:remToPx(1.125), onClick:()=>{}}
    const texture: ChipData = {label:"재질 표시", backgroundColor:"#FCDE8C", fontSize:remToPx(1.125), onClick:()=>{}}
    const temperature: ChipData = {label:"온도 측정", backgroundColor:"#FCDE8C", fontSize:remToPx(1.125), onClick:()=>{}}

    const createRoute: ChipData = {label:"경로 생성", backgroundColor:"#FF9F9F", fontSize:remToPx(1.125), onClick:()=>{}}
    const routeList: ChipData = {label:"경로 목록", backgroundColor:"#FF9F9F", fontSize:remToPx(1.125), onClick:()=>{
            setOpenLeftSideBar(!openLeftSideBar);
        }}

    return (
        <article>
            <section className={styles.cesium}>
                <CesiumWrapper/>
            </section>

            <div className={styles.onViewer}>
                <LeftSideBar leftSideBarState={{open: openLeftSideBar}} setOpenRightSideBar={setOpenRightSideBar}/>
                <div className={styles.topSheet}>
                    <div className={styles.emphasizeChips}>
                        <Chip chipData={popularCourse}/>
                        <Chip chipData={crosswalk}/>
                        <Chip chipData={sidewalk}/>
                        <Chip chipData={storageBox}/>
                        <Chip chipData={hospital}/>
                        <Chip chipData={drinkingFountain}/>
                    </div>

                    <div className={styles.emphasizeChips}>
                        <Chip chipData={altitude}/>
                        <Chip chipData={texture}/>
                        <Chip chipData={temperature}/>
                    </div>
                </div>
                <RightSideBar rightSideBarState={{open: openRightSideBar, setOpenRightSideBar: setOpenRightSideBar}}/>
            </div>

            <section className={styles.bottomSheet}>
                <div className={styles.routeChips}>
                    <Chip chipData={createRoute}/>
                    <Chip chipData={routeList}/>
                </div>
            </section>
        </article>
    )
}
