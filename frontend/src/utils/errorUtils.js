import toast from 'react-hot-toast';

/**
 * API 에러 처리
 * @param {Error} error - axios 에러 객체
 * @param {Object} options - 옵션
 * @param {boolean} options.suppressToast - 토스트 표시 여부
 * @param {boolean} options.suppressRedirect - 리다이렉트 억제 여부
 * @returns {string} 에러 메시지
 */
export const handleApiError = (error, options = {}) => {
  const { suppressToast = false, suppressRedirect = false } = options;

  // 네트워크 에러
  if (!error.response) {
    const message = '네트워크 오류가 발생했습니다. 연결을 확인해주세요.';
    if (!suppressToast) toast.error(message);
    return message;
  }

  const status = error.response.status;
  const data = error.response.data;
  let message = data?.message || '오류가 발생했습니다.';

  switch (status) {
    case 401:
      // 로그인 실패와 인증 만료 구분
      if (!suppressRedirect && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      message = '인증이 만료되었습니다. 다시 로그인해주세요.';
      break;

    case 403:
      message = data?.message || '접근 권한이 없습니다.';
      break;

    case 400:
      message = data?.message || '잘못된 요청입니다.';
      break;

    case 404:
      message = data?.message || '요청한 리소스를 찾을 수 없습니다.';
      break;

    case 500:
    case 502:
    case 503:
      message = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      break;

    default:
      message = data?.message || `오류가 발생했습니다. (${status})`;
  }

  if (!suppressToast) {
    toast.error(message);
  }

  return message;
};


