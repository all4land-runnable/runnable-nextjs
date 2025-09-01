import {clearDrawMarkers} from "@/app/utils/markers/clearDrawMarkers";
import drawingStart from "@/app/components/molecules/route-chips/route-onclick/drawingStart";
import {RouteChipsState} from "@/app/components/molecules/route-chips/RouteChips";
import {DrawingControllerState} from "@/app/components/molecules/drawing-controller/DrawingController";

export default function createRouteOnClick(routeChipsState:RouteChipsState, drawingControllerState:DrawingControllerState) {
    routeChipsState.setOpenRouteChips(false);
    drawingControllerState.setOpenDrawingController(true);
    clearDrawMarkers().then(()=>{
        drawingStart(()=>{}).then();
    });
}