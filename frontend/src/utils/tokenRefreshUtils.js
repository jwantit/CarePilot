import { getRefreshToken, setTokens, removeTokens } from './authTokenUtils';
import { authClient } from '../api/apiClient';

/**
 * Refresh Token으로 새로운 Access Token 발급
 * @returns {Promise<string>} 새로운 Access Token
 * @throws {Error} Refresh Token이 없거나 만료된 경우
 */
export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('Refresh token이 없습니다.');
  }
  
  try {
    // TODO: Redis 반영 후 백엔드 API 구현 필요
    // POST /auth/refresh
    // Request: { refreshToken: string }
    // Response: { accessToken: string, refreshToken: string }
    
    // const response = await authClient.post('/refresh', {
    //   refreshToken: refreshToken
    // });
    // 
    // const { accessToken, refreshToken: newRefreshToken } = response.data;
    // setTokens(accessToken, newRefreshToken);
    // 
    // return accessToken;
    
    throw new Error('Refresh Token API가 아직 구현되지 않았습니다.');
  } catch (error) {
    // Refresh Token도 만료된 경우
    removeTokens();
    throw error;
  }
};

/**
 * 토큰 갱신이 필요한지 확인
 * @param {string} accessToken - 현재 Access Token
 * @returns {boolean} 갱신이 필요하면 true
 */
export const shouldRefreshToken = (accessToken) => {
  if (!accessToken) {
    return false;
  }
  
  try {
    const base64Url = accessToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    
    if (!decoded.exp) {
      return false;
    }
    
    // 만료 5분 전이면 갱신 필요
    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;
    const fiveMinutes = 5 * 60 * 1000;
    
    return timeUntilExpiry < fiveMinutes;
  } catch (error) {
    console.error('토큰 확인 실패:', error);
    return false;
  }
};

