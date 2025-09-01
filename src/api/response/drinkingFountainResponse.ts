/**
 * 음수대 반환 타입
 */
export interface DrinkingFountain {
    cot_conts_name: string; // 공원/음수대 이름
    lat: string; // 위도
    lng: string; // 경도
    cot_addr_full_new?: string; // 도로명주소 (신주소)
    cot_addr_full_old?: string; // 지번주소 (구주소)
    cot_conts_id: string; // 컨텐츠 아이디
    pnu?: string | null; // 지번주소 코드
    rpnu?: string | null; // 도로명주소 코드
}

export interface DrinkingFountainResponse {
    DESCRIPTION: Record<string, string>;
    DATA: DrinkingFountain[];
}