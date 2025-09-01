import {RouteChipsState} from "@/app/components/molecules/route-chips/RouteChips";
import {DrawingControllerState} from "@/app/components/molecules/drawing-controller/DrawingController";
import {clearDrawMarkers} from "@/app/utils/markers/clearDrawMarkers";
import drawingRoute from "@/app/components/molecules/drawing-controller/drawing/drawingRoute";

export default function createRouteOnClick(routeChipsState:RouteChipsState, drawingControllerState:DrawingControllerState) {
    routeChipsState.setOpenRouteChips(false);
    drawingControllerState.setOpenDrawingController(true);
    clearDrawMarkers().then(()=>{
        drawingRoute(()=>{}).then();
    });
}