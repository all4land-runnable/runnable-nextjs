// temp2/record.ts

/** 프론트 도메인 모델 */
export type Record = {
    recordId: number;
    /** 사용자-경로 매핑이 없을 수 있음 */
    userRouteId?: number | null;

    /** 평균 페이스 (프로젝트 규약 단위: 예시 초/킬로) */
    pacesAverage: number;
}