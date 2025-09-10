import {SlopeDatum, SlopeGraphParam} from "@/app/components/molecules/slope-graph/SlopeGraph";

/**
 * 객체에 경사도를 추가하는 함수이다.
 *
 * @param slopeGraphParams 경사도가 추가될 객체
 */
export default function addSlope(slopeGraphParams: SlopeGraphParam[]): SlopeDatum[] {
    // 각 단일 객체 정보를 기반으로 경사도를 계산한다.
    return slopeGraphParams.map((slopeGraphParam, index) => {
        if (index === 0)
            return { ...slopeGraphParam, slope: 0 }; // 첫 인덱스의 경사도는 0

        // 경사도 연산
        const dx = slopeGraphParam.meter - slopeGraphParams[index - 1].meter; // 거리 델타
        const dz = slopeGraphParam.height - slopeGraphParams[index - 1].height; // 높이 델타
        const slope = dx !== 0 ? (dz / dx) * 100 : 0; // 경사도

        // 객체에 경사도를 추가해서 반환한다.
        return { ...slopeGraphParam, slope };
    });
}