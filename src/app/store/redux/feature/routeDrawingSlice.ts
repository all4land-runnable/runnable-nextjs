import {Route} from "@/type/route";
import { createSlice, PayloadAction } from '@reduxjs/toolkit';


type RouteDrawingState = {
    tempRoute: Route|null,
    pedestrianRoute: Route|null;
}

const initialState: RouteDrawingState = {
    tempRoute: null,
    pedestrianRoute: null
}

const routeDrawingSlice = createSlice({
    name: "routeDrawing",
    initialState,
    reducers: {
        setPedestrianRoute(state, action: PayloadAction<Route>) {
            state.pedestrianRoute = action.payload;
        },
        setTempRoute(state, action: PayloadAction<Route>) {
            state.tempRoute = action.payload;
        },
        resetRouteDrawing() {
            return initialState;
        },
    }
})

export const {
    setPedestrianRoute,
    setTempRoute,
    resetRouteDrawing
} = routeDrawingSlice.actions;
export default routeDrawingSlice.reducer;