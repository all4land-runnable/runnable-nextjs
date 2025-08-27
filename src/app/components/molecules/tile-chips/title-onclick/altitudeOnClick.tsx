import {viewerStore} from "@/app/components/templates/cesium/viewerStore";
import * as Cesium from "cesium";

// 우리가 적용할 머티리얼 타입 이름 (토글 시 비교용)
const MATERIAL_TAG = "ElevationColorContour";

export default async function altitudeOnClick() {
    try {
        // NOTE 1. 전역 Viewer 준비 대기
        const viewer = await viewerStore.wait();
        const globe = viewer.scene.globe;

        // NOTE 2. 토글 기능
        // 현재 globe.material이 ElevationColorContour라면 이미 켜져 있는 상태 → 해제
        const current = globe.material as Cesium.Material | undefined;
        if (current && current.type === MATERIAL_TAG) {
            globe.material = undefined; // 머티리얼 제거 (끄기)
            return;
        }

        // NOTE 3. 고도/등고선 기본값 정의
        // TODO: 평지에서 가시적인 성과를 얻기 위해, 최고 고도를 무시하고 표준값을 잡았다. 산악 지형은 무시된다.
        const minHeight = 0.0;      // 서울 최저 고도
        const maxHeight = 836.5;    // 북한산 최고 고도
        const contourSpacing = 5;     // 등고선 간격 (m)
        const contourWidth = 2;        // 등고선 선 두께 (px)
        const contourColor = Cesium.Color.YELLOW.clone(); // 등고선 색상

        // NOTE 4. 고도별 색상 그라데이션 팔레트(Canvas로 생성)
        // NOTE 4. 고도별 색상 그라데이션 팔레트(Canvas로 생성)
        const ramp = document.createElement("canvas");
        ramp.width = 512;
        ramp.height = 1;
        const ctx = ramp.getContext("2d")!;
        const grd = ctx.createLinearGradient(0, 0, ramp.width, 0);

        /**
         * 색상 순서: 흰색(투명) → 초록 → 노랑 → 주황 → 빨강 → 보라 → 파랑
         * - 알파값을 0.6~0.9 수준으로 높여 더 선명하게
         * - 구간을 단순화해 대비 강화
         */

        grd.addColorStop(0.00, "rgba(255,255,255,0.00)"); // 시작: 투명 흰
        grd.addColorStop(0.05, "rgba(0,200,83,0.70)");    // 초록
        grd.addColorStop(0.20, "rgba(255,255,0,0.75)");   // 노랑
        grd.addColorStop(0.40, "rgba(255,152,0,0.80)");   // 주황
        grd.addColorStop(0.60, "rgba(211,47,47,0.85)");   // 빨강
        grd.addColorStop(0.80, "rgba(156,39,176,0.88)");  // 보라
        grd.addColorStop(1.00, "rgba(0,51,255,0.90)");    // 파랑

        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, ramp.width, ramp.height);

        // NOTE 5. Elevation(색상) + Contour(선) 합성 머티리얼 생성
        globe.material = new Cesium.Material({
            fabric: {
                type: MATERIAL_TAG, // 머티리얼 타입 태그 (토글 판별용)
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
                            image: ramp,              // 색상 램프
                        },
                    },
                },
                // 두 재질을 합성하는 방식 정의
                components: {
                    diffuse:
                        "contourMaterial.alpha == 0.0 ? elevationRampMaterial.diffuse : contourMaterial.diffuse",
                    alpha: "max(contourMaterial.alpha, elevationRampMaterial.alpha)",
                },
            },
            translucent: false, // 불투명
        });
    } catch (e) {
        // 에러 처리 (예: viewerStore.wait 실패 시)
        alert(`지형 정보를 불러오지 못했습니다.\n에러 원인: ${e}`);
    }
}
