


export const IMAGE_HOST = "http://localhost:8080";

/**
 * @param {string} path
 * @returns {string|null} - 브라우저에서 접근 가능한 전체 URL
 */
export const getFileUrl = (path) => {
  if (!path) return null;

  // 이미 전체 경로(http)로 들어온 경우 그대로 반환
  if (path.startsWith('http')) return path;

  // 서버의 이미지 출력 API 엔드포인트에 맞춰 결합
  return `${IMAGE_HOST}/display/${path}`;
};

