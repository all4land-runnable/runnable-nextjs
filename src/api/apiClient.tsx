import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'https://localhost:8080/api/v1',
    withCredentials: false
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // 공통 에러 처리 가능
        return Promise.reject(error);
    }
);

export default apiClient;