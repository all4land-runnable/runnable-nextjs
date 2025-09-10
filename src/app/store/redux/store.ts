// src/app/store/redux/store.ts
'use client';

import { configureStore } from '@reduxjs/toolkit';
import leftSidebarReducer from "@/app/store/redux/feature/leftSidebarSlice";
import rightSidebarReducer from "@/app/store/redux/feature/rightSidebarSlice";

export const store = configureStore({
    reducer: {
        leftSidebar: leftSidebarReducer,
        rightSideBar: rightSidebarReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;