import {LeftSideBarState} from "@/app/components/templates/left-side-bar/LeftSideBar";

/**
 * 경로 목록 버튼을 클릭했을 때 수행되는 동작을 구현한 함수
 *
 * @param leftSideBarState 왼쪽 사이드 바 확장 상태
 */
export default function routeListOnClick(leftSideBarState: LeftSideBarState) {
    // 왼쪽 사이드 바를 연다.
    leftSideBarState.setOpenLeftSideBar(!leftSideBarState.openLeftSideBar);
}