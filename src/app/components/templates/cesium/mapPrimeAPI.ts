// src/app/components/templates/cesium/mapPrimeAPI.ts
import 'cesium';
import {Cartesian3} from "cesium";

// TODO: 업데이트 해야됨
export interface WaterOptions {
    positions?: Cartesian3[] | Array<[number, number]>; // 둘 다 지원하면 이렇게
    rectangle?: [number, number, number, number];       // [W,S,E,N] (deg)
    height?: number;
    alpha?: number;
    size?: number;
    reflectivity?: number;
    distortionScale?: number;
    flowDegrees?: number;
    color?: string;
}

export interface MapPrimeAPI {
    _createWater(options:WaterOptions): void
    // …실제 메서드들
}
declare module 'cesium' {
    interface Viewer { mapPrime?: MapPrimeAPI }
}
