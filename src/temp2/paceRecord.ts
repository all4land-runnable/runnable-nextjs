export type PaceRecord = {
    paceRecordId: number;
    recordId: number;
    /** 섹션이 없을 수 있어 optional */
    sectionId?: number | null;

    /** 페이스(예: 초/킬로 등 프로젝트 규약에 맞춰 사용) */
    pace: number;
}
