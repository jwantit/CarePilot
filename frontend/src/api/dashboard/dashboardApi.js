import { apiClient } from "../apiClient";

const host = `/dashboard`;

/**
 * 대시보드 통계 데이터 조회
 * @param {number} organizationId 조직 ID
 * @param {number} userId 사용자 ID (선택적)
 * @returns {Promise<Object>} 대시보드 통계 데이터
 */
export const getDashboardStats = async (organizationId, userId) => {
  const params = userId ? { userId } : {};
  const res = await apiClient.get(`${host}/${organizationId}/stats`, { params });
  return res.data;
};

/**
 * 긴급 환자 목록 조회 (risk_level이 CRITICAL인 케어 대상자)
 * @param {number} organizationId 조직 ID
 * @returns {Promise<Array>} 긴급 환자 목록
 */
export const getUrgentPatients = async (organizationId) => {
  const res = await apiClient.get(`${host}/${organizationId}/urgent-patients`);
  return res.data;
};

/**
 * 대기 중인 작업 목록 조회 (status가 WAITING인 작업)
 * @param {number} organizationId 조직 ID
 * @returns {Promise<Array>} 대기 중인 작업 목록
 */
export const getWaitingTasks = async (organizationId) => {
  const res = await apiClient.get(`${host}/${organizationId}/waiting-tasks`);
  return res.data;
};

/**
 * 긴급 알림 목록 조회 (severity가 CRITICAL 또는 HIGH이고 status가 ACTIVE인 알림)
 * @param {number} organizationId 조직 ID
 * @param {number} userId 사용자 ID (선택적)
 * @returns {Promise<Array>} 긴급 알림 목록
 */
export const getUrgentNotifications = async (organizationId, userId) => {
  const params = userId ? { userId } : {};
  const res = await apiClient.get(`${host}/${organizationId}/urgent-notifications`, { params });
  return res.data;
};

/**
 * 오늘의 일정 조회
 * @param {number} organizationId 조직 ID
 * @returns {Promise<Array>} 오늘의 일정 목록
 */
export const getTodaySchedules = async (organizationId) => {
  const res = await apiClient.get(`${host}/${organizationId}/today-schedules`);
  return res.data;
};

/**
 * 진행 중인 작업 목록 조회 (status가 WAITING 또는 PROGRESS인 작업)
 * @param {number} organizationId 조직 ID
 * @returns {Promise<Array>} 진행 중인 작업 목록
 */
export const getInProgressTasks = async (organizationId) => {
  const res = await apiClient.get(`${host}/${organizationId}/in-progress-tasks`);
  return res.data;
};

