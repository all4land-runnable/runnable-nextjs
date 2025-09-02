import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

const instance = axios.create({
    withCredentials: false,
});

instance.interceptors.request.use(
    (config) => {
        if (config.baseURL) {
            config.url = `${config.baseURL}${config.url}`;
            config.baseURL = "";
        }
        return config;
    },
    (error) => Promise.reject(error)
);

instance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API Error:", error?.response?.data || error.message);
        return Promise.reject(error);
    }
);

export const apiClient = {
    get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        instance.get<T>(url, config),

    post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        instance.post<T>(url, data, config),

    put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        instance.put<T>(url, data, config),

    delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        instance.delete<T>(url, config),
};

export default apiClient;
