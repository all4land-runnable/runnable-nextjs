// src/app/store/redux/feature/rightSidebarSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type RightSideBarState = {
    rightSidebarOpen: boolean;
    automaticRoute: boolean;
}

const initialState: RightSideBarState = {
    rightSidebarOpen: false,
    automaticRoute: false,
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
        resetRightSidebar() {
            return initialState;
        },
    }
})

export const {
    toggleOpen,
    setRightSidebarOpen,
    setAutomaticRoute,
    resetRightSidebar,
} = rightSideBarSlice.actions;
export default rightSideBarSlice.reducer;