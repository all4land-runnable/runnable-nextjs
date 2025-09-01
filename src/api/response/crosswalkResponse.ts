/**
 * 횡단보도 반환타입
 */
export interface Crosswalk {
    sgg_cd: string; // 시군구코드
    emd_cd: string; // 읍면동코드
    node_wkt: string; // POINT(...) 또는 빈 문자열
    node_type_cd: string; // 노드 유형 코드 (NODE일 때 주로 사용)
    bgng_lnkg_id: number | null; // 시작노드 ID (LINK)
    lnkg_wkt: string; // LINESTRING(...) 또는 빈 문자열
    lnkg_id: number; // 링크 ID (NODE는 0)
    node_type: 'NODE' | 'LINK'; // 구분
    sgg_nm: string; // 시군구명
    node_id: number; // 노드 ID (LINK는 0)
    emd_nm: string; // 읍면동명
    lnkg_len: number | null; // 링크 길이 (m) — LINK에서 사용
    end_lnkg_id: number | null; // 종료노드 ID (LINK)
    lnkg_type_cd: string; // 링크 유형 코드 (예: 1000, 1011)
}

export interface CrosswalkResponse {
    DESCRIPTION: Record<string, string>;
    DATA: Crosswalk[];
}
