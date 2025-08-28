import {viewerStore} from "@/app/components/templates/cesium/viewerStore";
import * as Cesium from 'cesium';
import apiClient from "@/api/apiClient";
import {HospitalResponse} from "@/api/hospital/hospitalResponse";
import {UnactiveError} from "@/error/unactiveError";

const SAMPLE_RADIUS = 500

/**
 * 병원 버튼을 누를 때 수행되는 동작을 구현한 함수
 * TODO: 한번 더 누르면 기존에 누른 값은 지워지도록 만들 것
 */
export async function hospitalOnClick(){
    // NOTE 1. 전역 Viewer 대기
    const viewer = await viewerStore.wait()
    const scene = viewer.scene;

    // NOTE 2. 화면 중앙 값 판별
    // 화면 중앙지점 조준
    const ray = scene.camera.getPickRay(new Cesium.Cartesian2(
        scene.canvas.clientWidth / 2, // 화면 중앙 X
        scene.canvas.clientHeight / 2 // 화면 중앙 Y
    ));

    // 예외처리 (중앙 값이 식별되지 않은 경우)
    if(!ray) {
        alert("ray 생성 실패")
        throw new UnactiveError(-101, "버튼 비활성화");
    }

    // 화면 중앙 좌표 조회
    const cartesian = scene.globe.pick(ray!, scene);

    // 예외처리 (중앙의 위치가 잡히지 않은 경우)
    if(!cartesian) {
        alert("cartesian 생성 실패")
        throw new UnactiveError(-101, "버튼 비활성화");
    }

    // NOTE 3: 좌표계 변환 (Cartesian3 > 일반 좌표계)
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    const cameraLon = Cesium.Math.toDegrees(cartographic.longitude);
    const cameraLat = Cesium.Math.toDegrees(cartographic.latitude);

    // NOTE 4. 병원 반경 검색 API
    const response = await apiClient.get('/getHospBasisList', {
        baseURL: 'https://apis.data.go.kr/B551182/hospInfoServicev2',
        params: {
            ServiceKey: process.env.NEXT_PUBLIC_OPEN_DATA_POTAL_ACCESS_KEY,
            xPos: cameraLon,
            yPos: cameraLat,
            radius: SAMPLE_RADIUS
        },
    })

    // api response 데이터 반환
    const hospitalResponse:HospitalResponse = response.data;
    const hospitals = hospitalResponse.response.body.items.item ?? []

    // NOTE 3. 예외처리 (병원이 조회되지 않았을 경우)
    if(hospitals.length <= 0){
        alert("주변에 조회된 병원이 없습니다.");
        throw new UnactiveError(-101, "버튼 비활성화");
    }

    // NOTE 4. 엔티티 추가
    // NOTE 4-1. 카메라 이동 이벤트 리스너도 있으나 API 사용 수를 줄이기 위해 사용하지 않음.
    hospitals.map((hospital)=>{
        viewer.entities.add({
            // 병원 위치
            position: Cesium.Cartesian3.fromDegrees(Number(hospital.XPos), Number(hospital.YPos)),

            // 병원 아이콘 (크기 50×50 고정) px임
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
                text: hospital.yadmNm ?? '병원',
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
        })

    })
}