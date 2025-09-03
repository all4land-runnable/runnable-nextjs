import * as Cesium from "cesium";

export default function hideMarkers(entities: Cesium.Entity[], visible: boolean) {
    // point/label 유무 상관 없이 엔티티 자체를 숨기거나 보이게
    entities.forEach((entity) => {
        entity.show = visible;
    })
}