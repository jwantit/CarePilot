import { apiClient } from "../apiClient";

const host = `/tasks`;

// 작업 목록 조회 (필터: sourceType=USER|AI, status, priority, type, assignedToUserId)
export const getTaskList = async (params = {}) => {
  const res = await apiClient.get(host, { params });
  return res.data;
};

// 작업 상세 조회
export const getTask = async (taskId) => {
  const res = await apiClient.get(`${host}/${taskId}`);
  return res.data;
};

// 작업 생성
export const createTask = async (body) => {
  const res = await apiClient.post(host, body);
  return res.data;
};

// 작업 수정
export const updateTask = async (taskId, body) => {
  const res = await apiClient.put(`${host}/${taskId}`, body);
  return res.data;
};

// 작업 상태 변경 (WAITING, PROGRESS, DONE)
export const updateTaskStatus = async (taskId, status) => {
  const res = await apiClient.patch(`${host}/${taskId}/status`, { status });
  return res.data;
};

// 작업 할당자 변경
export const updateTaskAssign = async (taskId, assignedToUserId) => {
  const res = await apiClient.patch(`${host}/${taskId}/assign`, { assignedToUserId });
  return res.data;
};

// 작업 삭제
export const deleteTask = async (taskId) => {
  const res = await apiClient.delete(`${host}/${taskId}`);
  return res.data;
};

// SCHEDULE_CHANGE + inboundSms 연결 작업: '시작' 시 AI 예약 변경 자동 처리 트리거
export const triggerScheduleChange = async (taskId) => {
  const res = await apiClient.post(`${host}/${taskId}/trigger-schedule-change`);
  return res.data;
};
