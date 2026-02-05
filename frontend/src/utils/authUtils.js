/**
 * API 응답에서 사용자 정보 추출
 * @param {Object} userInfo - API 응답 객체
 * @param {string} userInfo.userId - 사용자 ID
 * @param {string} userInfo.email - 이메일
 * @param {string} userInfo.name - 이름
 * @param {string} userInfo.role - 사용자 역할
 * @param {number} userInfo.organizationId - 조직 ID
 * @param {string} userInfo.status - 사용자 상태
 * @returns {Object|null} 추출된 사용자 정보 { userId, email, name, role, organizationId, status }
 */
export const extractUserInfo = (userInfo) => {
  if (!userInfo || !userInfo.userId) {
    return null;
  }

  return {
    userId: userInfo.userId,
    email: userInfo.email,
    name: userInfo.name,
    role: userInfo.role,
    organizationId: userInfo.organizationId,
    status: userInfo.status,
  };
};

