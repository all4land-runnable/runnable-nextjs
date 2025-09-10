import * as Cesium from "cesium";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";

/**
 * 고도 표시 Chip 버튼을 누를 때 수행되는 동작을 구현한 함수
 */
export default async function altitudeOnClick() {
    try {
        // NOTE 1. 전역 Viewer 준비 대기
        const viewer = getViewer();
        const globe = viewer.scene.globe;

        // NOTE 2. 토글 기능
        // globe.material이 ElevationColorContour라면 이미 켜져 있다면,
        if (globe.material?.type === "ElevationColorContour") {
            globe.material = undefined; // 머티리얼 제거 (끄기)
            return;
        }

        // NOTE 3. 고도/등고선 기본값 정의
        const minHeight = 10.0; // 서울 최저 고도
        const maxHeight = 836.5; // 서울 최고 고도 (북한산)
        const contourSpacing = 5; // 등고선 간격 (m)
        const contourWidth = 2; // 등고선 선 두께 (px)

        // NOTE 4. 고도별 색상 그라데이션 호출
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 1;

        const context = canvas.getContext("2d")!;
        const gradient = context.createLinearGradient(0, 0, canvas.width, 0);

        // NOTE 5. 높이에 따른 그라데이션 값 지정
        /**
         * 색상 순서: 흰색(투명) > 초록 > 노랑 > 주황 > 빨강 > 보라 > 파랑
         *
         * 알파값을 0.6~0.9 수준으로 점차 높여 더 선명하게
         * 구간을 단순화해 대비 강화
         */
        gradient.addColorStop(0.00, "rgba(255,255,255,0.00)"); // 시작: 투명 흰
        gradient.addColorStop(0.05, "rgba(0,200,83,0.70)");    // 초록
        gradient.addColorStop(0.20, "rgba(255,255,0,0.75)");   // 노랑
        gradient.addColorStop(0.40, "rgba(255,152,0,0.80)");   // 주황
        gradient.addColorStop(0.60, "rgba(211,47,47,0.85)");   // 빨강
        gradient.addColorStop(0.80, "rgba(156,39,176,0.88)");  // 보라
        gradient.addColorStop(1.00, "rgba(0,51,255,0.90)");    // 파랑

        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);

        // NOTE 5. 실제 등고선 제작
        globe.material = new Cesium.Material({
            fabric: {
                type: "ElevationColorContour", // 머티리얼 타입 태그 (토글 판별용)
                materials: {
                    // 등고선 재질
                    contourMaterial: {
                        type: "ElevationContour",
                        uniforms: {
                            width: contourWidth,
                            spacing: contourSpacing,
                            // color: Cesium.Color.WHITE.clone(), // 단색 흰색
                            color: Cesium.Color.TRANSPARENT
                        },
                    },
                    // 고도 색상 재질
                    elevationRampMaterial: {
                        type: "ElevationRamp",
                        uniforms: {
                            minimumHeight: minHeight, // 최소 고도
                            maximumHeight: maxHeight, // 최대 고도
                            image: canvas,              // 색상 램프
                        },
                    },
                },
                // 두 재질을 합성하는 방식 정의
                components: {
                    diffuse: "contourMaterial.alpha == 0.0 ? elevationRampMaterial.diffuse : contourMaterial.diffuse",
                    alpha: "max(contourMaterial.alpha, elevationRampMaterial.alpha)",
                },
            },
        });
    } catch (e) { alert(`지형 정보를 불러오지 못했습니다.\n에러 원인: ${e}`); }
}
