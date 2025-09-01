import {LeftSideBarState} from "@/app/components/templates/left-side-bar/LeftSideBar";

export default function routeListOnClick(leftSideBarState: LeftSideBarState) {
    leftSideBarState.setOpenLeftSideBar(!leftSideBarState.openLeftSideBar);
}