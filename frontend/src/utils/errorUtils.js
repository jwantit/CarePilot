import { removeTokens } from './authTokenUtils';
import toast from 'react-hot-toast';

/**
 * API 에러 처리
 * @param {Error} error - axios 에러 객체
 * @param {Function} onLogout - 로그아웃 콜백 함수 (선택적)
 * @returns {string} 에러 메시지
 */
export const handleApiError = (error, onLogout = null) => {
  // 네트워크 에러
  if (!error.response) {
    const message = '네트워크 오류가 발생했습니다. 연결을 확인해주세요.';
    toast.error(message);
    return message;
  }

  const status = error.response.status;
  const data = error.response.data;

  switch (status) {
    case 401:
      // Unauthorized: 토큰 만료 또는 유효하지 않음
      handleUnauthorizedError(onLogout);
      return '인증이 만료되었습니다. 다시 로그인해주세요.';

    case 403:
      // Forbidden: 권한 없음
      const forbiddenMessage = data?.message || '접근 권한이 없습니다.';
      toast.error(forbiddenMessage);
      return forbiddenMessage;

    case 400:
      // Bad Request: 잘못된 요청
      const badRequestMessage = data?.message || '잘못된 요청입니다.';
      toast.error(badRequestMessage);
      return badRequestMessage;

    case 404:
      // Not Found
      const notFoundMessage = data?.message || '요청한 리소스를 찾을 수 없습니다.';
      toast.error(notFoundMessage);
      return notFoundMessage;

    case 500:
    case 502:
    case 503:
      // Server Error
      const serverErrorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      toast.error(serverErrorMessage);
      return serverErrorMessage;

    default:
      // 기타 에러
      const defaultMessage = data?.message || `오류가 발생했습니다. (${status})`;
      toast.error(defaultMessage);
      return defaultMessage;
  }
};

/**
 * 401 Unauthorized 에러 처리
 * @param {Function} onLogout - 로그아웃 콜백 함수 (선택적)
 */
export const handleUnauthorizedError = (onLogout = null) => {
  // 토큰 제거
  removeTokens();

  // 로그아웃 콜백이 있으면 실행
  if (onLogout && typeof onLogout === 'function') {
    onLogout();
  }

  // 로그인 페이지로 리다이렉트
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }

  toast.error('인증이 만료되었습니다. 다시 로그인해주세요.');
};

/**
 * 특정 에러 타입에 따른 메시지 반환
 * @param {Error} error - 에러 객체
 * @returns {string} 사용자 친화적인 에러 메시지
 */
export const getErrorMessage = (error) => {
  if (!error.response) {
    return '네트워크 오류가 발생했습니다.';
  }

  const status = error.response.status;
  const data = error.response.data;

  const errorMessages = {
    400: data?.message || '잘못된 요청입니다.',
    401: '인증이 필요합니다.',
    403: data?.message || '접근 권한이 없습니다.',
    404: data?.message || '요청한 리소스를 찾을 수 없습니다.',
    500: '서버 오류가 발생했습니다.',
    502: '서버 연결 오류가 발생했습니다.',
    503: '서비스를 일시적으로 사용할 수 없습니다.',
  };

  return errorMessages[status] || data?.message || '오류가 발생했습니다.';
};

