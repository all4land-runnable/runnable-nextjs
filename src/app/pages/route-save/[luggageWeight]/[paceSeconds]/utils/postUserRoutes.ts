import {Route} from "@/type/route";
import apiClient from "@/api/apiClient";
import CommonResponse from "@/api/response/common_response";
import {UserRoute} from "@/api/response/userRoute";

export async function postUserRoute(userId: number, categoryName:string, route: Route) {
    const response = await apiClient.post<CommonResponse<UserRoute>>(
        `/api/v1/next_routes/${userId}/${categoryName}`,
        route,
        { baseURL: process.env.NEXT_PUBLIC_FASTAPI_URL }
    )
    const userRoutes:CommonResponse<UserRoute> = response.data
    if(!userRoutes) {
        alert("경로 저장에 실패하였습니다.")
        throw new Error("User routes not found");
    }
    alert('경로가 저장되었습니다!')
}