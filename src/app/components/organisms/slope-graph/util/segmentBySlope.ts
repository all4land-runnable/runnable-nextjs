import {SlopeGraphParam} from "@/app/components/organisms/slope-graph/SlopeGraph";

// 오르막 내리막 클래스
type upDownDatum = { meter: number; height: number | null };

/**
 * 기울기 부호를 통해 색상을 분리하는 함수이다.
 * 추가로 섹션 중앙 x 좌표를 계산한다. TODO: x좌표 계산안하고 Label 지정해도 될듯
 *
 * @param slopeGraphParams 사용될 경사도 정보들(오르막 그래프, 내리막 그래프, 중앙 그래프)
 */
export default function segmentBySlope(slopeGraphParams: SlopeGraphParam[]) {
    // NOTE 1. 객체 얕은 복사
    // Null로 그리면 해당 x축에 그래프가 안그려진다.
    const up: upDownDatum[] = slopeGraphParams.map(slopeGraphParam => ({ meter: slopeGraphParam.meter, height: null }));
    const down: upDownDatum[] = slopeGraphParams.map(slopeGraphParam => ({ meter: slopeGraphParam.meter, height: null }));

    // NOTE 2. 오르막과 내리막을 계산한다.
    const slopes: number[] = [];
    for (let i = 0; i < slopeGraphParams.length - 1; i++) {
        // 높이 델타 값
        const dh = slopeGraphParams[i + 1].height - slopeGraphParams[i].height;

        // 경사도 구분(오르막은 +1, 내리막은 -1)
        slopes[i] = (dh > 0 ? 1 : dh < 0 ? -1 : 0);

        if (slopes[i] > 0) { // 오르막이면,
            up[i].height = slopeGraphParams[i].height;
            up[i + 1].height = slopeGraphParams[i + 1].height;
        } else if (slopes[i] < 0) { // 내리막이면,
            down[i].height = slopeGraphParams[i].height;
            down[i + 1].height = slopeGraphParams[i + 1].height;
        }
    }

    return {up, down};
}