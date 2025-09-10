import * as Cesium from "cesium";
import type {Viewer} from "cesium";
import Drawer from "@cesium-extends/drawer";

declare global {
    interface Window {
        // for Cesium
        Cesium: typeof Cesium;
        viewer?: Viewer;
        drawer?: Drawer;

        // for Drawing
        tempRoute?: Cesium.Entity
        tempRouteMarkers?:Cesium.Entity[]
        pedestrianRoute?: Cesium.Entity
        circularHelper?: Cesium.Entity

        // for TOC
        crosswalks?: Cesium.Entity[]
        drinkingFountains?: Cesium.Entity[]
        hospitals?:Cesium.Entity[]
        sidewalkDS?: Cesium.GeoJsonDataSource
    }
}

export const setTempEntity = (entity: Cesium.Entity|undefined) => window.tempRoute = entity;
export const getTempEntity = ()=>{
    if(!window.tempRoute) throw new Error('TempRoute not found.');
    return window.tempRoute
}

export const setPedestrianEntity = (entity: Cesium.Entity|undefined) => window.pedestrianRoute = entity;
export const getPedestrianEntity = ()=>{
    if(!window.pedestrianRoute) throw new Error('Pedestrian not found.');
    return window.pedestrianRoute
}

export const setTempRouteMarkers = (entities: Cesium.Entity[]) => getTempRouteMarkers().push(...entities);
export const getTempRouteMarkers = ()=>{
    if(!window.tempRouteMarkers || window.tempRouteMarkers.length === 0) window.tempRouteMarkers = [];
    return window.tempRouteMarkers
}

export const setCircularHelper = (entity: Cesium.Entity|undefined) => window.circularHelper = entity;
export const getCircularHelper = ()=>{
    if(!window.circularHelper) throw new Error('CircularHelper not found.');
    return window.circularHelper;
}

export const setCrosswalk = (entities: Cesium.Entity[]) => getCrosswalk().push(...entities);
export const getCrosswalk = ()=>{
    if(!window.crosswalks || window.crosswalks?.length === 0) window.crosswalks = [];
    return window.crosswalks;
}

export const setDrinkingFoundation = (entities: Cesium.Entity[]) => getDrinkingFoundation().push(...entities);
export const getDrinkingFoundation = ()=>{
    if(!window.drinkingFountains || window.drinkingFountains?.length === 0) window.drinkingFountains = [];
    return window.drinkingFountains;
}

export const setHospital = (entities: Cesium.Entity[]) => getHospital().push(...entities);
export const getHospital = ()=>{
    if(!window.hospitals || window.hospitals?.length === 0) window.hospitals = [];
    return window.hospitals;
}

export const setSidewalkDS = (geojson: Cesium.GeoJsonDataSource) => window.sidewalkDS = geojson;
export const getSidewalkDS = ()=>{
    if(!window.sidewalkDS) throw new Error('Sidewalk not found.');
    return window.sidewalkDS
}