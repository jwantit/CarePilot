// 토큰 저장 키
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

/**
 * Access Token 저장
 * @param {string} token - JWT Access Token
 */
export const setAccessToken = (token) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

/**
 * Refresh Token 저장
 * @param {string} token - JWT Refresh Token
 */
export const setRefreshToken = (token) => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

/**
 * Access Token 조회
 * @returns {string|null} JWT Access Token
 */
export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Refresh Token 조회
 * @returns {string|null} JWT Refresh Token
 */
export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * 모든 토큰 저장
 * @param {string} accessToken - JWT Access Token
 * @param {string} refreshToken - JWT Refresh Token
 */
export const setTokens = (accessToken, refreshToken) => {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
};

/**
 * 모든 토큰 제거
 */
export const removeTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * JWT 토큰에서 payload 디코딩
 * @param {string} token - JWT Token
 * @returns {object|null} Decoded payload
 */
export const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('토큰 디코딩 실패:', error);
    return null;
  }
};

/**
 * Access Token에서 사용자 정보 추출
 * @returns {object|null} 사용자 정보 (userId, role, organizationId, status)
 */
export const getUserFromToken = () => {
  const token = getAccessToken();
  if (!token) {
    return null;
  }
  
  const decoded = decodeToken(token);
  if (!decoded) {
    return null;
  }
  
  return {
    userId: decoded.userId,
    role: decoded.role,
    organizationId: decoded.organizationId,
    status: decoded.status,
  };
};

/**
 * 토큰 만료 여부 확인
 * @param {string} token - JWT Token
 * @returns {boolean} 만료되었으면 true
 */
export const isTokenExpired = (token) => {
  if (!token) {
    return true;
  }
  
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  
  // exp는 초 단위이므로 1000을 곱해서 밀리초로 변환
  const expirationTime = decoded.exp * 1000;
  const currentTime = Date.now();
  
  return currentTime >= expirationTime;
};

/**
 * Access Token이 유효한지 확인
 * @returns {boolean} 유효하면 true
 */
export const isAccessTokenValid = () => {
  const token = getAccessToken();
  if (!token) {
    return false;
  }
  
  return !isTokenExpired(token);
};

