import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

// Axios 단일 인스턴스 전역 생성.
const instance = axios.create({
    withCredentials: false,
});

/**
 * API 요청 로직 구현(인터셉터)
 *
 * 여기에 정의된 데이터를 활용해야 한다.
 */
instance.interceptors.request.use(
    // 데이터 전송을 위해선 baseURL, url이 필요하다.
    (config) => {
        if (config.baseURL) {
            config.url = `${config.baseURL}${config.url}`;
            config.baseURL = "";
        }
        return config;
    },
    // 만약 요청 로직에 에러가 발생한다면, 에러를 반환한다.
    (error) => Promise.reject(error)
);

/**
 * API 반환 로직 구현(인터셉터)
 *
 * 여기에 정의된 데이터를 활용해야 한다.
 */
instance.interceptors.response.use(
    // Response를 바로 반환한다.
    (response) => response,
    // 만약 반환 로직에 에러가 발생했다면, 에러를 반환한다.
    (error) => {
        console.error("API Error:", error?.response?.data || error.message);
        return Promise.reject(error);
    }
);

/**
 * AXIOS 전역에서 타입 명시 없이 사용할 수 있도록 변경
 *
 * REST API 활용에 필요한 모든 요청들을 전달한다.
 */
export const apiClient = {
    get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        instance.get<T>(url, config),

    post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        instance.post<T>(url, data, config),

    put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        instance.put<T>(url, data, config),

    patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        instance.patch<T>(url, data, config),

    delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        instance.delete<T>(url, config),
};

export default apiClient;
