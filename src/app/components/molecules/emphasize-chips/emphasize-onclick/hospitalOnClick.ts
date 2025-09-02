import * as Cesium from 'cesium';
import apiClient from "@/api/apiClient";
import { UnactiveError } from "@/error/unactiveError";
import {getCameraPosition, getViewer} from "@/app/components/templates/cesium/viewer/getViewer";
import {HospitalResponse} from "@/api/response/hospitalResponse";

const SAMPLE_RADIUS = 500;

export const hospitalEntities:Cesium.Entity[] = []

const hospitalEntityId = (name: string, lat: number, lon: number) => `hospital_${name}-${lat}-${lon}`;

/**
 * 병원 버튼을 누를 때 수행되는 동작을 구현한 함수
 * TODO: 한번 더 누르면 기존에 누른 값은 지워지도록 만들 것
 */
export async function hospitalOnClick() {
    const viewer = await getViewer();
    const position = await getCameraPosition(viewer);

    // NOTE 1. 병원 반경 검색 API
    const response = await apiClient.get<HospitalResponse>("/getHospBasisList", {
        baseURL: "https://apis.data.go.kr/B551182/hospInfoServicev2",
        params: {
            ServiceKey: process.env.NEXT_PUBLIC_OPEN_DATA_POTAL_ACCESS_KEY!,
            xPos: position.lon,
            yPos: position.lat,
            radius: SAMPLE_RADIUS,
        },
    });

    // api response 데이터 반환
    const hospitalResponse: HospitalResponse = response.data;
    const hospitals = hospitalResponse.response?.body?.items?.item ?? [];

    // NOTE 2. 예외처리 (병원이 조회되지 않았을 경우)
    if (hospitals.length <= 0) {
        alert("반경 500m 내에 표시할 병원 데이터가 없습니다.");
        throw new UnactiveError(-101, "버튼 비활성화");
    }

    // NOTE 3. 중복 방지 세트
    const drawn = new Set<string>();

    // NOTE 4. 엔티티 추가
    hospitals.forEach((hospital) => {
        // 병원 고유 ID 생성 (요양기관번호 ykiho 사용 권장)
        const id = hospitalEntityId(hospital.ykiho, Number(hospital.YPos), Number(hospital.XPos));

        // 이미 추가된 엔티티라면 스킵
        if (drawn.has(id) || viewer.entities.getById(id)) return;

        // 엔티티 추가
        const hospitalEntity = viewer.entities.add({
            id, // 고유 엔티티 ID
            // 병원 위치
            position: Cesium.Cartesian3.fromDegrees(Number(hospital.XPos), Number(hospital.YPos)),

            // 병원 아이콘 (크기 50×50 고정)
            billboard: {
                image: '/resource/hospital.png',
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                heightReference: Cesium.HeightReference.CLAMP_TO_3D_TILE,
                width: 50,
                height: 50,
                pixelOffset: new Cesium.Cartesian2(0, -10),
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
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                showBackground: true,
                backgroundColor: Cesium.Color.WHITE.withAlpha(0.8),
                backgroundPadding: new Cesium.Cartesian2(6, 4),
                heightReference: Cesium.HeightReference.CLAMP_TO_3D_TILE,
                eyeOffset: new Cesium.Cartesian3(0, 0, -10),
            }
        });

        hospitalEntities.push(hospitalEntity);

        // 중복 방지 Set에 등록
        drawn.add(id);
    });
}
