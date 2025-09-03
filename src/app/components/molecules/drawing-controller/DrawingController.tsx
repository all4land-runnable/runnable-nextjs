'use client';

import styles from "./DrawingController.module.css";
import {RoundButton, RoundButtonParam} from "@/app/components/atom/round-button/RoundButton";
import React, {useState} from "react";
import {remToPx} from "@/app/utils/claculator/pxToRem";
import workoutAvailabilityOnClick from "@/app/components/molecules/drawing-controller/drawing-controller-onclick/workoutAvailabilityOnClick";
import saveDrinkingFountainsInfoOnClick from "@/app/components/molecules/drawing-controller/drawing-controller-onclick/saveDrinkingFountainsInfoOnClick";
import {useModal} from "@/app/components/common/modal/ModalProvider";
import {completeDrawingOnClick} from "@/app/components/molecules/drawing-controller/drawing-controller-onclick/completeDrawingOnClick";
import {drawMarkerEntities} from "@/app/components/molecules/drawing-controller/drawing/upsertDrawMarkers";
import circularRouteOnClick from "@/app/components/molecules/drawing-controller/drawing-controller-onclick/circularRouteOnClick";
import { useRouter } from "next/navigation";
import clearMarkers from "@/app/utils/markers/clearMarkers";
import drawingRoute, { removeDrawPolyline } from "./drawing/drawingRoute";
import {getDrawer} from "@/app/components/templates/cesium/drawer/getDrawer";

/**
 * 경로 그리기 컨트롤러 함수를 구현하는 함수
 * @constructor
 */
export default function DrawingController() {
    const router = useRouter();
    const { openConfirm, close } = useModal();
    const [ circular, setCircular ] = useState<boolean>(false);

    // 뒤로가기 버튼 선택 함수
    const closeDrawingController:RoundButtonParam = {label: "뒤로 가기", backgroundColor: "#D9D9D9", fontSize: remToPx(0.75), toggle:false, onClick: () => closeOnclick()}
    const workoutAvailability:RoundButtonParam = {label: "운동 가능 시간", backgroundColor: "#D9D9D9", fontSize:remToPx(0.75), onClick: workoutAvailabilityOnClick}
    const saveDrinkingFountainsInfo:RoundButtonParam = {label: "음수대 정보 표시", backgroundColor: "#D9D9D9", fontSize:remToPx(0.75), onClick: saveDrinkingFountainsInfoOnClick}
    const circularRoute:RoundButtonParam = {label: "원형 경로", backgroundColor: "#D9D9D9", fontSize:remToPx(0.75), toggle:true, onClick: ()=>{
        circularRouteOnClick(circular).then()
        setCircular(!circular);
    }}
    const completeDrawing:RoundButtonParam = {label: "경로 완성", backgroundColor: "#D9D9D9", fontSize:remToPx(0.75), onClick: () => {
        openConfirm({title: "경로 저장", content: "경로를 저장하시겠습니까?",
            onConfirm: ()=>{
                close();
                completeDrawingOnClick(drawMarkerEntities, circular).then();
            },
            onCancel: close
        })
    }}

    // NOTE 1. 화면 생성 시 작동
    process()

    // NOTE 2. UI 구현
    return (
        <div className={styles.drawingController}>
            <RoundButton roundButtonParam={closeDrawingController}/> {/* 뒤로가기 */}
            <RoundButton roundButtonParam={workoutAvailability}/> {/* 운동 가능 시간 */}
            <RoundButton roundButtonParam={saveDrinkingFountainsInfo}/> {/* 음수대 정보 표시 */}
            <RoundButton roundButtonParam={circularRoute}/> {/* 원형 경로 표시 */}
            <RoundButton roundButtonParam={completeDrawing}/> {/* 경로 완성 */}
        </div>
    )

    function process() {
        // 모든 그리기 마커를 제거한다.
        clearMarkers(drawMarkerEntities).then(()=>{ // 그 후
            removeDrawPolyline().then(() => {// Polyline도 제거한다.
                // 새 경로 그리기를 시작한다.
                drawingRoute(()=>{}).then();
            });
        });
    }

    async function closeOnclick() {
        const drawer = await getDrawer(); // drawer 호출
        drawer.reset() // 그리기를 완료하지 않고, 초기화 했으면, 자동으로 종료된다.

        clearMarkers(drawMarkerEntities).then() // 기존에 그려진 경로 마커들을 제거한다.
        removeDrawPolyline().then(); // Polyline도 제거한다.

        router.back()
    }
}