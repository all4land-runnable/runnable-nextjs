import {Route} from "@/type/route";
import { createSlice, PayloadAction } from '@reduxjs/toolkit';


type RouteDrawingState = {
    tempRoute: Route,
    pedestrianRoute: Route;
}

const initialState: RouteDrawingState = {
    tempRoute: {
        title:"",
        description:"",
        distance:-1.0,
        pace:-1.0,
        highHeight:-1.0,
        lowHeight:-1.0,
        sections: []
    },
    pedestrianRoute: {
        title:"",
        description:"",
        distance:-1.0,
        pace:-1.0,
        highHeight:-1.0,
        lowHeight:-1.0,
        sections: []
    }
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