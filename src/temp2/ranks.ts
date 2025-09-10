export type Rank = {
    rankId: number;
    /** 레코드와의 연결이 없을 수도 있음 */
    recordId?: number | null;

    /** 순위 (1, 2, 3, ...) */
    rank: number;
}