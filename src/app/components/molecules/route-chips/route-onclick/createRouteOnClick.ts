import {RouteChipsState} from "@/app/components/molecules/route-chips/RouteChips";
import {DrawingControllerState} from "@/app/components/molecules/drawing-controller/DrawingController";
import drawingRoute, {removeDrawPolyline} from "@/app/components/molecules/drawing-controller/drawing/drawingRoute";
import {clearDrawMarkers} from "@/app/components/molecules/drawing-controller/drawing/clearDrawMarkers";

/**
 * 경로 생성 버튼을 클릭했을 때 수행되는 동작을 구현한 함수
 *
 * @param routeChipsState 경로 관련 버튼 확장 상태
 * @param drawingControllerState 경로 그리기 컨트롤러 확장 상태
 */
export default function createRouteOnClick(routeChipsState:RouteChipsState, drawingControllerState:DrawingControllerState) {
    // 경로 관련 버튼을 닫는다.
    routeChipsState.setOpenRouteChips(false);

    // 경로 그리기 컨트롤러를 연다.
    drawingControllerState.setOpenDrawingController(true);

    // 모든 그리기 마커를 제거한다.
    clearDrawMarkers().then(()=>{ // 그 후
        removeDrawPolyline().then(() => {// Polyline도 제거한다.
            // 새 경로 그리기를 시작한다.
            drawingRoute(()=>{}).then();
        });
    });
}