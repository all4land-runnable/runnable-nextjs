// src/app/store/redux/feature/rightSidebarSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {SlopeGraphParam} from "@/app/components/molecules/slope-graph/SlopeGraph";
import {SectionStrategyParam} from "@/app/components/molecules/pace-strategy/PaceStrategy";
import {RouteRankingParam} from "@/app/components/molecules/route-ranking/RouteRanking";

type RightSideBarState = {
    open: boolean;
    slopeGraphParams: SlopeGraphParam[];
    sectionStrategies: SectionStrategyParam[];
    routeRankingParams: RouteRankingParam[];
}

const initialState: RightSideBarState = {
    open: false,
    slopeGraphParams: [],
    sectionStrategies: [],
    routeRankingParams: [],
};

const rightSideBarSlice = createSlice({
    name: "rightSidebar",
    initialState,
    reducers: {
        toggleOpen(state) {
            state.open = !state.open;
        },
        setOpen(state, action: PayloadAction<boolean>) {
            state.open = action.payload;
        },
        setSlopeGraphParams(state, action: PayloadAction<SlopeGraphParam[]>) {
            state.slopeGraphParams = action.payload;
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
                slopeGraphParams?: SlopeGraphParam[];
                sectionStrategies?: SectionStrategyParam[];
                routeRankingParams?: RouteRankingParam[];
            }>
        ) {
            const { slopeGraphParams, sectionStrategies, routeRankingParams } = action.payload;
            if (slopeGraphParams) state.slopeGraphParams = slopeGraphParams;
            if (sectionStrategies) state.sectionStrategies = sectionStrategies;
            if (routeRankingParams) state.routeRankingParams = routeRankingParams;
            state.open = true;
        },
        resetRightSidebar() {
            return initialState;
        },
    }
})

export const {
    toggleOpen,
    setOpen,
    setSlopeGraphParams,
    setSectionStrategies,
    setRouteRankingParams,
    openWithData,
    resetRightSidebar,
} = rightSideBarSlice.actions;
export default rightSideBarSlice.reducer;