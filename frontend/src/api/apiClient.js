import axios from 'axios';
import { getAccessToken } from '../utils/authTokenUtils';

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

// TODO: Redis 반영 후 Refresh Token 갱신 인터셉터 추가
// apiClient.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     // 401 에러 발생 시 refreshAccessToken() 호출하여 토큰 갱신 후 재시도
//     // utils/tokenRefreshUtils.js의 refreshAccessToken 함수 사용
//   }
// );

export default apiClient;

