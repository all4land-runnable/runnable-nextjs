export interface TemperatureResponse {
    temperature: Temperature[];
}

export interface Temperature {
    baseDate: string; // "YYYYMMDD"
    baseTime: string; // "HHMM"
    category: "TMP";  // 고정
    fcstDate: string; // 예보 일자 "YYYYMMDD"
    fcstTime: string; // 예보 시간 "HHMM"
    fcstValue: number; // 온도
    nx: number; // 예보지점 x 좌표
    ny: number; // 예보지점 y 좌표
}