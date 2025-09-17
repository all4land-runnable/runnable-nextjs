import * as Cesium from "cesium";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";
import requestRender from "@/app/components/organisms/cesium/util/requestRender";

/**
 * 고도 표시 - 현재 height(0..1)에 맞춰 그라데이션을 생성/업데이트
 *  - 이미 ElevationColorContour가 있으면 끄지 않고 image만 교체
 *  - min/max는 UI의 normalizedToAltitude와 일치하도록 0~40m로 통일
 */
export default async function changeAltitude(height: number = 0.3) {
    try {
        const viewer = getViewer();
        const globe = viewer.scene.globe;

        // === 범위 통일(표시값과 일치) ===
        const minHeight = -5.0;
        const maxHeight = 40.0;

        const contourSpacing = 5; // m
        const contourWidth = 2;   // px

        // === 그라데이션 캔버스 ===
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 1;

        const context = canvas.getContext("2d")!;
        const gradient = context.createLinearGradient(0, 0, canvas.width, 0);

        const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
        const add = (p: number, color: string) => gradient.addColorStop(clamp01(p), color);

        // 중심(height)을 기준으로 좌우로 확장(경계는 clamp)
        add(height - 0.20, "rgba(0,0,0,0.30)"); // 투명
        add(height - 0.15, "rgba(46,16,101,0.90)");   // 보라(어두운)
        add(height - 0.09, "rgba(12,31,89,0.70)");    // 남색
        add(height - 0.06, "rgba(0,80,220,0.50)");    // 파랑
        add(height - 0.03, "rgba(0,150,220,0.20)");   // 청록
        add(height, "rgba(0,255,255,1.00)"); // 흰(중심, 점차 투명)
        add(height + 0.03, "rgba(255,255,0,0.20)");   // 노랑
        add(height + 0.06, "rgba(255,152,0,0.50)");   // 주황
        add(height + 0.09, "rgba(211,47,47,0.70)");   // 빨강
        add(height + 0.15, "rgba(156,39,176,0.90)");  // 보라
        add(height + 0.20, "rgba(0,0,0,0.30)"); // 투명

        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);

        // === 이미 켜져 있으면 업데이트만 ===
        if (globe.material?.type === "ElevationColorContour") {
            const mat = globe.material;
            const ramp = mat.materials?.elevationRampMaterial;
            if (ramp?.uniforms) {
                ramp.uniforms.minimumHeight = minHeight;
                ramp.uniforms.maximumHeight = maxHeight;
                ramp.uniforms.image = canvas;
                requestRender();
                return;
            }
        }

        // === 없으면 새로 생성 ===
        globe.material = new Cesium.Material({
            fabric: {
                type: "ElevationColorContour",
                materials: {
                    contourMaterial: {
                        type: "ElevationContour",
                        uniforms: {
                            width: contourWidth,
                            spacing: contourSpacing,
                            color: Cesium.Color.TRANSPARENT, // 등고선 비가시
                        },
                    },
                    elevationRampMaterial: {
                        type: "ElevationRamp",
                        uniforms: {
                            minimumHeight: minHeight,
                            maximumHeight: maxHeight,
                            image: canvas,
                        },
                    },
                },
                components: {
                    diffuse:
                        "contourMaterial.alpha == 0.0 ? elevationRampMaterial.diffuse : contourMaterial.diffuse",
                    alpha:
                        "max(contourMaterial.alpha, elevationRampMaterial.alpha)",
                },
            },
        });

        requestRender();
    } catch (e) {
        alert(`지형 정보를 불러오지 못했습니다.\n에러 원인: ${e}`);
    }
}
