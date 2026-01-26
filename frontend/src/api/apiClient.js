import axios from 'axios';
import { getAccessToken, removeTokens } from '../utils/authTokenUtils';
import { refreshAccessToken } from '../utils/tokenRefreshUtils';

// 서버 주소
export const API_SERVER_HOST = 'http://localhost:8080';

// 기본 axios 인스턴스 (인증 API용 - 토큰 불필요)
export const authClient = axios.create({
  baseURL: `${API_SERVER_HOST}/auth`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 일반 API용 axios 인스턴스 (토큰 필요)
export const apiClient = axios.create({
  baseURL: `${API_SERVER_HOST}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * API 요청에 토큰 추가하는 헬퍼 함수
 * @param {object} config - axios config 객체
 * @returns {object} 토큰이 추가된 config 객체
 */
export const addTokenToRequest = (config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// 요청 인터셉터: 모든 요청에 토큰 자동 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 401 에러 시 자동으로 토큰 갱신 후 재시도
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // 401 에러이고, 아직 재시도하지 않은 요청인 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      console.log('401 에러 발생, 토큰 갱신 시도...');
      
      try {
        // Refresh Token으로 새 Access Token 발급
        const newAccessToken = await refreshAccessToken();
        console.log('토큰 갱신 성공');
        
        // 새 토큰으로 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('토큰 갱신 실패:', refreshError);
        // Refresh Token도 만료된 경우 로그인 페이지로 리다이렉트
        removeTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

