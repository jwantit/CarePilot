import { authClient } from './apiClient';
import { addTokenToRequest } from './apiClient';

/**
 * 업체 회원가입 (MANAGER)
 * @param {Object} data - 회원가입 정보
 * @param {string} data.organizationName - 업체명
 * @param {string} data.email - 이메일
 * @param {string} data.password - 비밀번호
 * @param {string} data.name - 이름
 * @returns {Promise<Object>} { organizationNumber }
 */
export const signupOrganization = async (data) => {
  const response = await authClient.post('/signup/organization', {
    organizationName: data.organizationName,
    email: data.email,
    password: data.password,
    name: data.name,
  });
  return response.data;
};

/**
 * 직원 회원가입 (USER)
 * @param {Object} data - 회원가입 정보
 * @param {string} data.organizationNumber - 업체 번호
 * @param {string} data.email - 이메일
 * @param {string} data.password - 비밀번호
 * @param {string} data.name - 이름
 * @returns {Promise<Object>} { message, status }
 */
export const signupUser = async (data) => {
  const response = await authClient.post('/signup/user', {
    organizationNumber: data.organizationNumber,
    email: data.email,
    password: data.password,
    name: data.name,
  });
  return response.data;
};

/**
 * 로그인
 * @param {Object} data - 로그인 정보
 * @param {string} data.email - 이메일
 * @param {string} data.password - 비밀번호
 * @returns {Promise<Object>} { accessToken, refreshToken, tokenType }
 */
export const login = async (data) => {
  const response = await authClient.post('/login', {
    email: data.email,
    password: data.password,
  });
  return response.data;
};

/**
 * 로그아웃
 * @returns {Promise<Object>} { message }
 */
export const logout = async () => {
  const config = addTokenToRequest({});
  const response = await authClient.post('/logout', null, config);
  return response.data;
};

/**
 * 사용자 승인
 * @param {string} token - 승인 토큰
 * @returns {Promise<Object>} { message, status, email }
 */
export const approveUser = async (token) => {
  const response = await authClient.get('/approve', {
    params: { token },
  });
  return response.data;
};

/**
 * USER 소셜 회원가입 (organization_number 필요, status = WAITING)
 * @param {Object} data - 회원가입 정보
 * @param {string} data.email - 카카오 이메일
 * @param {string} data.name - 카카오 닉네임
 * @param {string} data.password - 비밀번호
 * @param {string} data.organizationNumber - 조직 번호
 * @returns {Promise<Object>} OAuth2LoginResponseDTO
 */
export const signupUserOAuth2 = async (data) => {
  const response = await authClient.post('/oauth2/signup/user', {
    email: data.email,
    name: data.name,
    password: data.password,
    organizationNumber: data.organizationNumber,
  });
  return response.data;
};

