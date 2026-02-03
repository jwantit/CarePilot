import { authClient, loginClient } from './apiClient';

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
    phone: data.phone,
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
    phone: data.phone,
  });
  return response.data;
};

/**
 * 로그인
 * @param {Object} data - 로그인 정보
 * @param {string} data.email - 이메일
 * @param {string} data.password - 비밀번호
 * @returns {Promise<Object>} { userId, email, name, role, organizationId, status, tokenType }
 * 토큰은 httpOnly 쿠키로 설정되므로 응답에는 사용자 정보만 포함
 */
export const login = async (data) => {
  // Spring Security 폼 로그인은 /login 경로 사용
  const response = await loginClient.post('/login', 
    new URLSearchParams({
      email: data.email,
      password: data.password,
    })
  );
  // 응답에는 사용자 정보만 포함 (토큰은 쿠키로 설정됨)
  return response.data;
};

/**
 * 현재 로그인한 사용자 정보 조회
 * 쿠키에서 토큰을 읽어서 사용자 정보 반환
 * @returns {Promise<Object>} { userId, email, name, role, organizationId, status, tokenType }
 */
export const getCurrentUserInfo = async () => {
  try {
  const response = await authClient.get('/me');
  return response.data;
  } catch (error) {
    // 401은 정상 (로그인 안 된 상태)이므로 로그 출력 안 함
    if (error.response?.status !== 401) {
      console.error('[getCurrentUserInfo] 사용자 정보 조회 실패', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
    }
    throw error;
  }
};

/**
 * 로그아웃
 * 쿠키가 자동 전송되므로 별도 토큰 설정 불필요
 * @returns {Promise<Object>} { message }
 */
export const logout = async () => {
  // 쿠키가 자동 전송되므로 별도 설정 불필요
  const response = await authClient.post('/logout');
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

