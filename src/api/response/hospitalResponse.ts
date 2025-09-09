/**
 * 병원 반환타입
 */
export type Hospital = {
    addr: string; // 주소
    clCd: number; // 구분 코드
    clCdNm: string; // 구분 코드명 (종합병원, 병원 등)
    cmdcGdrCnt: number;
    cmdcIntnCnt: number;
    cmdcResdntCnt: number;
    cmdcSdrCnt: number;
    detyGdrCnt: number;
    detyIntnCnt: number;
    detyResdntCnt: number;
    detySdrCnt: number;
    distance: string; // 거리 (string으로 제공됨)
    drTotCnt: number; // 의사 총 수
    emdongNm: string; // 읍/면/동
    estbDd: number; // 설립일 (YYYYMMDD)
    hospUrl: string; // 병원 홈페이지 URL
    mdeptGdrCnt: number;
    mdeptIntnCnt: number;
    mdeptResdntCnt: number;
    mdeptSdrCnt: number;
    pnursCnt: number;
    postNo: string; // 우편번호
    sgguCd: number;
    sgguCdNm: string; // 시군구명
    sidoCd: number;
    sidoCdNm: string; // 시/도명
    telno: string; // 전화번호
    XPos: number | string; // 경도
    YPos: number | string; // 위도
    yadmNm: string; // 병원 이름
    ykiho: string; // 암호화된 병원 ID
};

