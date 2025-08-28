import apiClient from "@/api/apiClient";
import * as Cesium from "cesium";
import radiusFilter from "@/app/utils/radiusFilter";
import {UnactiveError} from "@/error/unactiveError";
import {DrinkingFountainResponse} from "@/api/response/drinkingFountainResponse";
import {getCameraPosition, getViewer} from "@/app/components/templates/cesium/getViewer";

const drinkingFountainEntityId = (name: string, lat:number, lon:number) => `drinking-${name}-${lat}-${lon}`;

/**
 * 음수대 버튼을 누를 때 수행되는 동작을 구현한 함수
 * TODO: 한번 더 누르면 기존에 누른 값은 지워지도록 만들 것
 */
export default async function drinkingFountainOnClick() {
    // NOTE 1. 전역 Viewer 대기
    const viewer = await getViewer()
    const point = await getCameraPosition(viewer);

    // NOTE 2. 음수대 조회 API
    const response = await apiClient.get('/dataset/drinkingFountain.json', {
        baseURL: 'http://localhost:3000',
    })

    // api response 데이터 반환
    const drinkingFountainResponse: DrinkingFountainResponse = response.data
    let drinkingFountains = drinkingFountainResponse.DATA

    // 로컬 파일 이용하므로, 반경 검색 직접 구현
    drinkingFountains = radiusFilter(drinkingFountains, point.lat, point.lon);

    // NOTE 3. 예외처리 (음수대가 조회되지 않았을 경우)
    if(drinkingFountains.length <= 0){
        alert("반경 500m 내에 표시할 음수대 데이터가 없습니다.");
        throw new UnactiveError(-101, "버튼 비활성화");
    }

    const drawn = new Set<string>();

    // NOTE 3. 엔티티 추가
    // NOTE 3-1. 카메라 이동 이벤트 리스너도 있으나 API 사용 수를 줄이기 위해 사용하지 않음.
    drinkingFountains.forEach((drinkingFountain)=>{
        // 엔티티 고유 ID 생성 (이름+좌표 기반)
        const id = drinkingFountainEntityId(drinkingFountain.cot_conts_name, point.lat, point.lon);

        // 이미 추가된 엔티티가 있으면 스킵
        if (drawn.has(id) || viewer.entities.getById(id)) return;

        viewer.entities.add({
            id, // 고유 엔티티 ID 지정
            position: Cesium.Cartesian3.fromDegrees(Number(drinkingFountain.lng), Number(drinkingFountain.lat)), // 음수대 위치
            billboard: { // 음수대 아이콘 (크기 50×50 고정) px임
                image: '/resource/drinking-fountain.png',
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                heightReference: Cesium.HeightReference.CLAMP_TO_3D_TILE,
                width: 50,
                height: 50,
                pixelOffset: new Cesium.Cartesian2(0, -10),
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

                // 라벨도 지표/타일에 클램프
                heightReference: Cesium.HeightReference.CLAMP_TO_3D_TILE,

                // 카메라 쪽으로 살짝 당겨 z-fighting 방지
                eyeOffset: new Cesium.Cartesian3(0, 0, -10),
            },
        });

        // 중복 방지 세트에 등록
        drawn.add(id);
    })
}
