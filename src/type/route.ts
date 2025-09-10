import {Section} from "@/type/section";

export type Route = {
    title: string;
    description: string;

    /** 총 거리 (예: m 단위 정수) */
    distance: number;

    /** 최고/최저 고도 (예: m 단위 부동소수) */
    highHeight: number;
    lowHeight: number;

    sections: Section[];
}