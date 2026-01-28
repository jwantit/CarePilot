import { apiClient } from "../apiClient";

const host = `/ai-tasks`;

// AI 처리 내역 목록 조회 (필터: status, taskType)
export const getAITaskList = async (params = {}) => {
  const res = await apiClient.get(host, { params });
  return res.data;
};

// AI 처리 내역 상세 조회
export const getAITask = async (aiTaskId) => {
  const res = await apiClient.get(`${host}/${aiTaskId}`);
  return res.data;
};
