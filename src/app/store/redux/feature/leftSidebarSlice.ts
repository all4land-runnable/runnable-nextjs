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
        toggleOpen(state) {
            state.open = !state.open;
        },
        setOpen(state, action: PayloadAction<boolean>) {
            state.open = action.payload;
        },
    }
})

export const { toggleOpen, setOpen } = leftSidebarSlice.actions;
export default leftSidebarSlice.reducer;