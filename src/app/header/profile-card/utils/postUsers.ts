import apiClient from "@/api/apiClient";
import {UserOut} from "@/api/response/users_response";
import CommonResponse from "@/api/response/common_response";

export async function postUsers(userId:number, username:string, age:number, runnerSince:number, paceAverage:number) {
    const response = await apiClient.patch<CommonResponse<UserOut>>(`/api/v1/users`, {
            user_id:userId,
            username:username,
            age:age,
            runner_since:runnerSince,
            pace_average:paceAverage,
        },
        { baseURL: process.env.NEXT_PUBLIC_FASTAPI_URL }
    );
    if(response.status === 200)
        alert("수정이 완료되었습니다.")
}