/**
 * 보행자 경로 안내 API 응답
 */
export interface PedestrianResponse {
    type: "FeatureCollection";
    features: Feature[];
}

/**
 * 지오메트리 정보 및 경로 속성을 담고 있는 개별 피처
 */
export interface Feature {
    type: "Feature";
    geometry: Geometry;
    properties: Properties;
}

/**
 * 경로의 지리적 좌표
 */
export type Geometry = Point | LineString;

/**
 * 단일 지점의 좌표
 */
export interface Point {
    type: "Point";
    coordinates: [number, number];
}

/**
 * 여러 지점의 선형 경로 좌표
 */
export interface LineString {
    type: "LineString";
    coordinates: [number, number][];
}

/**
 * 경로 안내 관련 상세 속성
 */
export interface Properties {
    /** 총 이동 거리 (미터) */
    totalDistance?: number;
    /** 총 소요 시간 (초) */
    totalTime?: number;
    /** 피처의 순서 */
    index: number;
    /** 지점 피처의 인덱스 */
    pointIndex?: number;
    /** 선 피처의 인덱스 */
    lineIndex?: number;
    /** 도로/시설물 이름 */
    name: string;
    /** 경로 안내 설명 */
    description: string;
    /** 방향 (예: 북, 남서 등) */
    direction?: string;
    /** 근처 POI(Point of Interest) 이름 */
    nearPoiName: string;
    /** 근처 POI의 X 좌표 (사용되지 않음) */
    nearPoiX: string;
    /** 근처 POI의 Y 좌표 (사용되지 않음) */
    nearPoiY: string;
    /** 교차로 이름 */
    intersectionName: string;
    /** 시설물 타입 코드 */
    facilityType: string;
    /** 시설물 이름 */
    facilityName: string;
    /** 회전 타입 코드 */
    turnType: number;
    /** 지점 타입 (시작: SP, 경유지: PP1/PP2, 안내 지점: GP, 도착: EP) */
    pointType?: "SP" | "GP" | "PP1" | "PP2" | "EP";
    /** 현재 구간 거리 (미터) */
    distance?: number;
    /** 현재 구간 시간 (초) */
    time?: number;
    /** 도로 타입 코드 */
    roadType?: number;
    /** 도로 카테고리 타입 코드 */
    categoryRoadType?: number;
}