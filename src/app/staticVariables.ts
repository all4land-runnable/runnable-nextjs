import * as Cesium from "cesium";

export const drawMarkerEntities:Cesium.Entity[] = [];

export let drawPolylineEntity: Cesium.Entity | null = null;
export let newRouteEntity: Cesium.Entity | null = null;

export function setDrawPolylineEntity(ent: Cesium.Entity | null) {
    drawPolylineEntity = ent;
}

export function setNewRouteEntity(ent: Cesium.Entity | null) {
    newRouteEntity = ent;
}

export const crosswalkEntities: Cesium.Entity[] = []
export const drinkingFountainEntities: Cesium.Entity[] = []
export const hospitalEntities:Cesium.Entity[] = []