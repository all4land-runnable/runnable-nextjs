export type LngLat = [number, number];

export type LineStringGeometry = {
    type: 'LineString';
    coordinates: LngLat[];
}