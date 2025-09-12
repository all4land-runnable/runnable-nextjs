import * as Cesium from "cesium";
import type {Viewer} from "cesium";
import Drawer from "@cesium-extends/drawer";

declare global {
    interface Window {
        // for Cesium
        Cesium: typeof Cesium;
        viewer?: Viewer;
        drawer?: Drawer;

        TEMP_ENTITY?: string;


        // for Drawing
        tempRouteMarkers?:Cesium.Entity[]
        pedestrianRouteMarkers?: Cesium.Entity[];

        // for TOC
        crosswalks?: Cesium.Entity[]
        drinkingFountains?: Cesium.Entity[]
        hospitals?:Cesium.Entity[]
        sidewalkDS?: Cesium.GeoJsonDataSource
    }
}

export function setTempEntity(id: string) {
    window.TEMP_ENTITY = id;
}

export function getTempEntity(): string {
    if(!window.TEMP_ENTITY) throw new Error("TempEntity not found.");
    return window.TEMP_ENTITY;
}

export const getTempRouteMarkers = ()=>{
    if(!window.tempRouteMarkers || window.tempRouteMarkers.length === 0) window.tempRouteMarkers = [];
    return window.tempRouteMarkers
}

export const getPedestrianRouteMarkers = () => {
    if (!window.pedestrianRouteMarkers || window.pedestrianRouteMarkers.length === 0)
        window.pedestrianRouteMarkers = [];
    return window.pedestrianRouteMarkers;
};

export const getCrosswalk = ()=>{
    if(!window.crosswalks || window.crosswalks?.length === 0) window.crosswalks = [];
    return window.crosswalks;
}

export const getDrinkingFoundation = ()=>{
    if(!window.drinkingFountains || window.drinkingFountains?.length === 0) window.drinkingFountains = [];
    return window.drinkingFountains;
}

export const getHospital = ()=>{
    if(!window.hospitals || window.hospitals?.length === 0) window.hospitals = [];
    return window.hospitals;
}

export const setSidewalkDS = (geojson: Cesium.GeoJsonDataSource) => window.sidewalkDS = geojson;
export const getSidewalkDS = ()=>{
    if(!window.sidewalkDS) throw new Error('Sidewalk not found.');
    return window.sidewalkDS
}