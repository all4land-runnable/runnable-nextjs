import styles from './emphasizeChips.module.css'
import React from "react";
import {remToPx} from "@/app/utils/pxToRem";
import Chip, {ChipParam} from "@/app/components/atom/chip/Chip";
import apiClient from "@/api/apiClient";
import {HospitalResponse} from "@/api/hospital/hospitalResponse";
import * as Cesium from "cesium";
import { viewerStore } from "@/app/components/templates/cesium/viewerStore";

/**
 * 구역 강조 버튼을 구현하는 함수
 * @constructor
 */
export default function EmphasizeChips() {
    const SAMPLE_RADIUS = 500

    // chip 버튼 속성 선언
    const popularCourse:ChipParam = {label:"인기 코스", backgroundColor:"#A1F0CB", fontSize:remToPx(1.125), onClick:()=>{
            alert("개발중: 인기 코스 데이터가 없습니다.");
        }};
    const crosswalk:ChipParam = {label:"횡단보도", backgroundColor:"#A1F0CB", fontSize:remToPx(1.125), onClick:()=>{}};
    const sidewalk:ChipParam = {label:"도보 경로", backgroundColor:"#A1F0CB", fontSize:remToPx(1.125), onClick:()=>{}};
    const storageBox:ChipParam = {label:"물품보관함", backgroundColor:"#A1F0CB", fontSize:remToPx(1.125), onClick:()=>{}};

    const hospital:ChipParam = {
        label:"병원",
        backgroundColor:"#A1F0CB",
        fontSize:remToPx(1.125),
        onClick: async () => {
            try {
                // NOTE 1. 전역 Viewer 대기
                const viewer = await viewerStore.wait()
                const scene = viewer.scene;

                const ray = scene.camera.getPickRay(new Cesium.Cartesian2(
                    scene.canvas.clientWidth / 2,   // 화면 중앙 X
                    scene.canvas.clientHeight / 2   // 화면 중앙 Y
                ));

                if(!ray) {
                    alert("ray 생성 실패")
                    return
                }

                const cartesian = scene.globe.pick(ray!, scene);

                if(!cartesian) {
                    alert("cartesian 생성 실패")
                    return
                }

                const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                const cameraLon = Cesium.Math.toDegrees(cartographic.longitude);
                const cameraLat = Cesium.Math.toDegrees(cartographic.latitude);

                // NOTE 2. 병원 반경 검색 API
                const response = await apiClient.get('/getHospBasisList', {
                    baseURL: 'https://apis.data.go.kr/B551182/hospInfoServicev2',
                    params: {
                        ServiceKey: process.env.NEXT_PUBLIC_OPEN_DATA_POTAL_ACCESS_KEY,
                        xPos: cameraLon,
                        yPos: cameraLat,
                        radius: SAMPLE_RADIUS
                    },
                })

                const hospitalResponse:HospitalResponse = response.data;

                // NOTE 3. 예외처리 (병원이 조회되지 않았을 경우)
                if(hospitalResponse.response.body.items.item.length <= 0){
                    alert("주변에 조회된 병원이 없습니다.");
                    return
                }

                // NOTE 4. 엔티티 추가
                // NOTE 4-1. 카메라 이동 이벤트 리스너도 있으나 API 사용 수를 줄이기 위해 사용하지 않음.
                hospitalResponse.response.body.items.item.map((item, index)=>{
                    viewer.entities.add({
                        position: Cesium.Cartesian3.fromDegrees(Number(item.XPos), Number(item.YPos)),

                        // 병원 아이콘 (크기 50×50 고정)
                        billboard: {
                            image: '/resource/hospital.png',
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                            heightReference: Cesium.HeightReference.CLAMP_TO_3D_TILE,
                            width: 50,
                            height: 50,
                            pixelOffset: new Cesium.Cartesian2(0, -10),
                            // 필요시 아이콘도 항상 위에 보이게
                            disableDepthTestDistance: Number.POSITIVE_INFINITY,
                        },

                        // 병원 이름 라벨
                        label: {
                            text: item.yadmNm ?? '병원',
                            font: '14px sans-serif',
                            fillColor: Cesium.Color.BLACK,
                            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                            outlineColor: Cesium.Color.WHITE,
                            outlineWidth: 2,
                            verticalOrigin: Cesium.VerticalOrigin.TOP,
                            pixelOffset: new Cesium.Cartesian2(0, 0),

                            // 가려짐 방지: 깊이 테스트 무시(항상 위에 표시)
                            disableDepthTestDistance: Number.POSITIVE_INFINITY,

                            // 가독성 개선: 반투명 배경
                            showBackground: true,
                            backgroundColor: Cesium.Color.WHITE.withAlpha(0.8),
                            backgroundPadding: new Cesium.Cartesian2(6, 4),

                            // (선택) 라벨도 지표/타일에 클램프
                            heightReference: Cesium.HeightReference.CLAMP_TO_3D_TILE,

                            // (선택) 카메라 쪽으로 살짝 당겨 z-fighting 방지
                            eyeOffset: new Cesium.Cartesian3(0, 0, -10),
                        },

                        name: item.yadmNm ?? '병원',
                        description: item.addr ?? ''
                    })

                })
            } catch (e) { alert(`병원 정보를 불러오지 못했습니다.\n에러 원인: ${e}`) }
        }
    };

    const drinkingFountain:ChipParam = {label:"음수대", backgroundColor:"#A1F0CB", fontSize:remToPx(1.125), onClick:()=>{}};

    return (
        <div className={styles.emphasizeChips}>
            <Chip chipParam={popularCourse}/> {/* 인기 코스 */}
            <Chip chipParam={crosswalk}/> {/* 횡단보도 */}
            <Chip chipParam={sidewalk}/> {/* 도보 경로 */}
            <Chip chipParam={storageBox}/> {/* 물품보관함 */}
            <Chip chipParam={hospital}/> {/* 병원 */}
            <Chip chipParam={drinkingFountain}/> {/* 음수대 */}
        </div>
    )
}
