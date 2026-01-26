import axios from 'axios';
import { store } from '../store/store';
import { resetAuth } from '../store/slices/authSlice';

// 서버 주소
export const API_SERVER_HOST = 'http://localhost:8080';

// 공통 설정
const commonConfig = {
  timeout: 10000,
  withCredentials: true, // 쿠키 자동 전송
};

// 인증 전용 클라이언트 (로그인, 회원가입 등)
export const authClient = axios.create({
  baseURL: `${API_SERVER_HOST}/auth`,
  ...commonConfig,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 인증된 API 클라이언트 (로그인 후 사용)
export const apiClient = axios.create({
  baseURL: `${API_SERVER_HOST}/api`,
  ...commonConfig,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Spring Security 폼 로그인용 클라이언트 (별도 처리)
export const loginClient = axios.create({
  baseURL: API_SERVER_HOST,
  ...commonConfig,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

// 토큰 갱신 중 플래그 (동시 요청 방지)
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// API 클라이언트 응답 인터셉터 설정
export const setupApiInterceptors = () => {
  // authClient 인터셉터 설정
  authClient.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error)
  );
  
  authClient.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error)
  );
  
  // 요청 인터셉터: 필요시 추가 헤더 설정
  apiClient.interceptors.request.use(
    (config) => {
      // 쿠키는 자동 전송되므로 별도 처리 불필요
      return config;
    },
    (error) => Promise.reject(error)
  );

  // 응답 인터셉터: 401 에러 시 토큰 갱신
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // 401 에러이고, 아직 재시도하지 않은 요청인 경우
      if (error.response?.status === 401 && !originalRequest._retry) {
        // refresh 엔드포인트는 제외 (무한 루프 방지)
        if (originalRequest.url?.includes('/refresh') || originalRequest.url?.includes('/auth/refresh')) {
          console.warn('[apiClient] refresh 엔드포인트 401 - resetAuth 호출');
          store.dispatch(resetAuth());
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }

        // 이미 갱신 중이면 대기열에 추가
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => {
              return apiClient(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Refresh Token으로 새 Access Token 발급
          await authClient.post('/refresh');
          
          // 대기 중인 요청 처리
          processQueue(null, true);
          isRefreshing = false;
          
          // 원래 요청 재시도
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh Token도 만료된 경우
          console.error('[apiClient] 토큰 갱신 실패 - 로그아웃 처리', {
            status: refreshError.response?.status,
            data: refreshError.response?.data,
          });
          processQueue(refreshError, null);
          isRefreshing = false;
          
          // Redux 상태 초기화
          store.dispatch(resetAuth());
          
          // 로그인 페이지로 리다이렉트 (현재 페이지가 로그인 페이지가 아닐 때만)
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
};

export default apiClient;

