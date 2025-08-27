import apiClient from "@/api/apiClient";
import {DrinkingFountainResponse} from "@/api/drinking-fountain/drinkingFountainResponse";
import {viewerStore} from "@/app/components/templates/cesium/viewerStore";
import * as Cesium from "cesium";

/**
 * 음수대 버튼을 누를 때 수행되는 동작을 구현한 함수
 * TODO: 한번 더 누르면 기존에 누른 값은 지워지도록 만들 것
 */
export default async function drinkingFountainOnClick() {
    try {
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
            return
        }

        // 화면 중앙 좌표 조회
        const cartesian = scene.globe.pick(ray!, scene);

        // 예외처리 (중앙의 위치가 잡히지 않은 경우)
        if(!cartesian) {
            alert("cartesian 생성 실패")
            return
        }

        // NOTE 4. 음수대 조회 API
        // TODO: 로컬 파일 이용하므로, 반경 검색 API 직접 구현해 볼 것
        const response = await apiClient.get('/dataset/drinkingFountain.json', {
            baseURL: 'http://localhost:3000',
        })

        // api response 데이터 반환
        const drinkingFountainResponse: DrinkingFountainResponse = response.data
        const drinkingFountains = drinkingFountainResponse.DATA

        // NOTE 3. 예외처리 (음수대가 조회되지 않았을 경우)
        if(drinkingFountains.length <= 0){
            alert("주변에 조회된 음수대가 없습니다.");
            return
        }

        drinkingFountains.map((drinkingFountain)=>{
            viewer.entities.add({
                // 음수대 위치 TODO: 좌표계 확인하기
                position: Cesium.Cartesian3.fromDegrees(Number(drinkingFountain.lng), Number(drinkingFountain.lat)),
                // 음수대 아이콘 (크기 50×50 고정) px임
                billboard: {
                    image: '/resource/drinking-fountain.png',
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    heightReference: Cesium.HeightReference.CLAMP_TO_3D_TILE,
                    width: 50,
                    height: 50,
                    pixelOffset: new Cesium.Cartesian2(0, -10),
                    // 필요시 아이콘도 항상 위에 보이게
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
                label: {
                    text: drinkingFountain.cot_conts_name ?? '음수대',
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
                }
            })
        })
        // TODO: 조회 실패시 버튼 활성화 복구하기
    } catch (e) { alert(`음수대 정보를 불러오지 못했습니다.\n에러 원인: ${e}`) }
}