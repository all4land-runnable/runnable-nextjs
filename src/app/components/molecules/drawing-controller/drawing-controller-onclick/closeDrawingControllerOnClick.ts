import {RouteChipsState} from "@/app/components/molecules/route-chips/RouteChips";
import {DrawingControllerState} from "@/app/components/molecules/drawing-controller/DrawingController";
import {getDrawer} from "@/app/components/templates/cesium/drawer/getDrawer";
import {clearDrawMarkers} from "@/app/components/molecules/drawing-controller/drawing/clearDrawMarkers";

/**
 * 뒤로가기 버튼을 클릭했을 때 수행되는 동작을 구현한 함수
 *
 * @param drawingControllerState 경로 그리기 컨트롤러 확장 상태
 * @param routeChipsState 경로 관련 버튼 확장 상태
 */
export default async function closeDrawingControllerOnClick(drawingControllerState: DrawingControllerState, routeChipsState: RouteChipsState){
    const drawer = await getDrawer(); // drawer 호출
    drawer.reset() // 그리기를 완료하지 않고, 초기화 했으면, 자동으로 종료된다.

    await clearDrawMarkers() // 기존에 그려진 경로 마커들을 제거한다.

    // 경로 그리기 컨트롤러를 닫는다.
    drawingControllerState.setOpenDrawingController(false);

    // 경로 관련 버튼을 연다.
    routeChipsState.setOpenRouteChips(true);
}