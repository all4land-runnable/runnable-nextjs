// src/app/store/redux/feature/rightSidebarSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {SectionStrategyParam} from "@/app/components/molecules/pace-strategy/PaceStrategy";
import {RouteRankingParam} from "@/app/components/molecules/route-ranking/RouteRanking";
import {Route} from "@/type/route";

type RightSideBarState = {
    rightSidebarOpen: boolean;

    automaticRoute: boolean;

    pedestrianRoute: Route;
    tempRoute: Route;

    sectionStrategies: SectionStrategyParam[];
    routeRankingParams: RouteRankingParam[];
}

const initialState: RightSideBarState = {
    rightSidebarOpen: false,

    automaticRoute: false,

    pedestrianRoute: {title: "", description: "", distance: 0, highHeight: 0, lowHeight: 0, sections: []},
    tempRoute: {title: "", description: "", distance: 0, highHeight: 0, lowHeight: 0, sections: []},

    sectionStrategies: [],
    routeRankingParams: [],
};

const rightSideBarSlice = createSlice({
    name: "rightSidebar",
    initialState,
    reducers: {
        toggleOpen(state) {
            state.rightSidebarOpen = !state.rightSidebarOpen;
        },
        setRightSidebarOpen(state, action: PayloadAction<boolean>) {
            state.rightSidebarOpen = action.payload;
        },

        setAutomaticRoute(state, action: PayloadAction<boolean>) {
            state.automaticRoute = action.payload
        },

        setPedestrianRoute(state, action: PayloadAction<Route>) {
            state.pedestrianRoute = action.payload;
        },
        setTempRoute(state, action: PayloadAction<Route>) {
            state.tempRoute = action.payload;
        },

        setSectionStrategies(state, action: PayloadAction<SectionStrategyParam[]>) {
            state.sectionStrategies = action.payload;
        },
        setRouteRankingParams(state, action: PayloadAction<RouteRankingParam[]>) {
            state.routeRankingParams = action.payload;
        },
        openWithData(
            state,
            action: PayloadAction<{
                pedestrianRoute?: Route;
                tempRoute?: Route;
                sectionStrategies?: SectionStrategyParam[];
                routeRankingParams?: RouteRankingParam[];
            }>
        ) {
            const { pedestrianRoute, tempRoute, sectionStrategies, routeRankingParams } = action.payload;
            if (pedestrianRoute) state.pedestrianRoute = pedestrianRoute;
            if (tempRoute) state.tempRoute = tempRoute;
            if (sectionStrategies) state.sectionStrategies = sectionStrategies;
            if (routeRankingParams) state.routeRankingParams = routeRankingParams;
            state.rightSidebarOpen = true;
        },
        resetRightSidebar() {
            return initialState;
        },
    }
})

export const {
    toggleOpen,
    setRightSidebarOpen,
    setAutomaticRoute,
    setPedestrianRoute,
    setTempRoute,
    setSectionStrategies,
    setRouteRankingParams,
    openWithData,
    resetRightSidebar,
} = rightSideBarSlice.actions;
export default rightSideBarSlice.reducer;