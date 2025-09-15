export interface UserOut {
    /** 사용자 ID(PK) */
    user_id: number;

    /** 사용자 이메일 */
    email: string;

    /** 표시될 이름 */
    username: string;

    /** 현재 나이 */
    age: number;

    /** 러닝 시작 연도 */
    runner_since: number;

    /** 평균 페이스(초/킬로미터) */
    pace_average: number;

    /** 소프트 삭제 여부 */
    is_deleted: boolean;

    /** 생성 시각(ISO 문자열) */
    created_at: string;

    /** 마지막 갱신 시각(ISO 문자열) */
    updated_at: string;
}