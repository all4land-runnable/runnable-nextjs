// src/app/store/redux/store.ts
'use client';
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from '@/app/store/feature/counterSlice';

export const store = configureStore({
    reducer: {
        counter: counterReducer,
    },
});
