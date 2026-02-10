import { apiClient } from '../apiClient';

/**
 * 통계 데이터 조회
 * @param {string} startDate - 시작 날짜 (yyyy-MM-dd HH:mm:ss 형식, 선택)
 * @param {string} endDate - 종료 날짜 (yyyy-MM-dd HH:mm:ss 형식, 선택)
 * @param {number} groupId - 그룹 ID (선택)
 * @param {string} disease - 질환 (선택)
 * @returns {Promise<Object>} 통계 데이터
 */
export const getStatistics = async (startDate = null, endDate = null, groupId = null, disease = null) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (groupId) params.append('groupId', groupId);
  if (disease) params.append('disease', disease);
  
  const queryString = params.toString();
  const url = `/reports/statistics${queryString ? `?${queryString}` : ''}`;
  
  const response = await apiClient.get(url);
  return response.data;
};

/**
 * 질환 목록 조회
 * @returns {Promise<Array<string>>} 질환 목록
 */
export const getDiseaseList = async () => {
  const response = await apiClient.get('/reports/diseases');
  return response.data;
};

