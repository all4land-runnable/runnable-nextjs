// src/app/store/redux/feature/leftSidebarSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {Route} from "@/type/route";

type leftSideBarState = {
    open: boolean;
    routes: Route[];
}

const initialState: leftSideBarState = {
    open: false,
    routes: []
};

const leftSidebarSlice = createSlice({
    name: "leftSidebar",
    initialState,
    reducers: {
        toggleLeftSidebarOpen(state) {
            state.open = !state.open;
        },
        setLeftSidebarOpen(state, action: PayloadAction<boolean>) {
            state.open = action.payload;
        },
        setRoutes(state, action: PayloadAction<Route[]>) {
            state.routes = action.payload;
        },
        resetLeftSidebar() {
            return initialState;
        },
    }
})

export const {
    toggleLeftSidebarOpen,
    setLeftSidebarOpen,
    setRoutes,
    resetLeftSidebar,
} = leftSidebarSlice.actions;
export default leftSidebarSlice.reducer;