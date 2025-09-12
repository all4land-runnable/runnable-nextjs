// src/app/store/redux/feature/leftSidebarSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type leftSideBarState = {
    open: boolean;
}

const initialState: leftSideBarState = {
    open: false,
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
    }
})

export const { toggleLeftSidebarOpen, setLeftSidebarOpen } = leftSidebarSlice.actions;
export default leftSidebarSlice.reducer;