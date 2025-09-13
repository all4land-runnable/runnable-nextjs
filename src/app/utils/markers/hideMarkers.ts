import {Entity} from "cesium";
import getViewer from "@/app/components/organisms/cesium/util/getViewer";

export default function hideMarkers(entities: Entity[], visible: boolean) {
    // point/label 유무 상관 없이 엔티티 자체를 숨기거나 보이게
    entities.forEach((entity) => {
        entity.show = visible;
    })
}

export function removeMarkers(entities: Entity[]) {
    const viewer = getViewer();

    entities.forEach((entity) => {
        viewer.entities.remove(entity);
    })
}