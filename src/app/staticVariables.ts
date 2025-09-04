import * as Cesium from "cesium";

export const drawMarkerEntities:Cesium.Entity[] = [];

export let tempRoute: Cesium.Entity | null = null;
export let pedestrianRoute: Cesium.Entity | null = null;

export function setTempRoute(ent: Cesium.Entity | null) {
    tempRoute = ent;
}

export function setPedestrianRoute(ent: Cesium.Entity | null) {
    pedestrianRoute = ent;
}

export const crosswalkEntities: Cesium.Entity[] = []
export const drinkingFountainEntities: Cesium.Entity[] = []
export const hospitalEntities:Cesium.Entity[] = []