import axios from 'axios';

/**
 * REST API를 효율적으로 활용하기 위한 요청 인터페이스
 */
const apiClient = axios.create({
    baseURL: 'https://localhost:8080/api/v1',
    withCredentials: false // 따로 쿠키는 사용하지 않음
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error); // 공통 에러 처리
    }
);

export default apiClient;