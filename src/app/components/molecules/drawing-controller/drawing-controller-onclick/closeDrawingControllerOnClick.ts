import {RouteChipsState} from "@/app/components/molecules/route-chips/RouteChips";
import {DrawingControllerState} from "@/app/components/molecules/drawing-controller/DrawingController";
import {getDrawer} from "@/app/components/templates/cesium/drawer/getDrawer";
import {clearDrawMarkers} from "@/app/utils/markers/clearDrawMarkers";

export default async function closeDrawingControllerOnClick(drawingControllerState: DrawingControllerState, routeChipsState: RouteChipsState){
    const drawer = await getDrawer();
    await clearDrawMarkers()
    drawer.reset()
    drawingControllerState.setOpenDrawingController(false);
    routeChipsState.setOpenRouteChips(true);
}