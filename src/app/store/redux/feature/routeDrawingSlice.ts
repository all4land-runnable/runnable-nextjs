// src/app/store/redux/feature/routeDrawingSlice.ts
import {Route} from "@/type/route";
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type RouteDrawingState = {
    tempRoute: Route|null,
    pedestrianRoute: Route|null;
};

const initialState: RouteDrawingState = {
    tempRoute: null,
    pedestrianRoute: null
};

const routeDrawingSlice = createSlice({
    name: "routeDrawing",
    initialState,
    reducers: {
        setPedestrianRoute(state, action: PayloadAction<Route>) {
            state.pedestrianRoute = action.payload;
        },
        clearPedestrianRoute(state) {               // ✅ 추가
            state.pedestrianRoute = null;
        },
        setTempRoute(state, action: PayloadAction<Route>) {
            state.tempRoute = action.payload;
        },
        resetRouteDrawing() {
            return initialState;
        },
    }
});

export const {
    setPedestrianRoute,
    clearPedestrianRoute,   // ✅ export
    setTempRoute,
    resetRouteDrawing
} = routeDrawingSlice.actions;
export default routeDrawingSlice.reducer;
