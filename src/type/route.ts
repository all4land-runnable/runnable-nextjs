export type Point = {
    index: number;
    latitude: number;
    longitude: number;
    height: number;
    distance: number;
}

export type Section = {
    distance: number;
    slope: number;

    pace: number;
    startPlace: string;
    strategies: string[];

    points: Point[];
}

export type Route = {
    title: string;
    description: string;

    /** 총 거리 (예: m 단위 정수) */
    distance: number;
    pace: number;

    /** 최고/최저 고도 (예: m 단위 부동소수) */
    highHeight: number;
    lowHeight: number;

    sections: Section[];
}