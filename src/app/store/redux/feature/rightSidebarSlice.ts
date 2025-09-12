// src/app/store/redux/feature/rightSidebarSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {SectionStrategyParam} from "@/app/components/molecules/pace-strategy/PaceStrategy";

type RightSideBarState = {
    rightSidebarOpen: boolean;

    automaticRoute: boolean;

    sectionStrategies: SectionStrategyParam[];
}

const initialState: RightSideBarState = {
    rightSidebarOpen: false,

    automaticRoute: false,

    sectionStrategies: [],
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



        setSectionStrategies(state, action: PayloadAction<SectionStrategyParam[]>) {
            state.sectionStrategies = action.payload;
        },
        openWithData(
            state,
            action: PayloadAction<{
                sectionStrategies?: SectionStrategyParam[];
            }>
        ) {
            const { sectionStrategies } = action.payload;
            if (sectionStrategies) state.sectionStrategies = sectionStrategies;
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
    setSectionStrategies,
    openWithData,
    resetRightSidebar,
} = rightSideBarSlice.actions;
export default rightSideBarSlice.reducer;