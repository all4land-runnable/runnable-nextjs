// src/app/store/redux/ReduxProvider.tsx
'use client';
import { Provider } from 'react-redux';
import { ReactNode } from 'react';
import { store } from "./store";

export default function ReduxProvider({ children }: { children: ReactNode }) {
    return (
        <Provider store={store}>
            {children}
        </Provider>
    );
}