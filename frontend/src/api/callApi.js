import { apiClient } from "./apiClient";

const host = `/calls`;

// 1. 통화 이력 목록 조회
export const getCallHistory = async () => {
  const res = await apiClient.get(`${host}/history`);
  return res.data;
};

// 2. 통화 상세 정보 조회
export const getCallDetail = async (callId) => {
  const res = await apiClient.get(`${host}/${callId}`);
  return res.data;
};

// 3. 다가올 일정 조회
export const getUpcomingSchedules = async () => {
  const res = await apiClient.get(`${host}/schedules/upcoming`);
  return res.data;
};

// 4. 새로운 일정 등록
export const createSchedule = async (scheduleData) => {
  const res = await apiClient.post(`${host}/schedules`, scheduleData);
  return res.data;
};

// 5. 일정 수정
export const updateSchedule = async (scheduleId, scheduleData) => {
  const res = await apiClient.put(`${host}/schedules/${scheduleId}`, scheduleData);
  return res.data;
};

// 6. 일정 삭제 (Soft delete)
export const deleteSchedule = async (scheduleId) => {
  const res = await apiClient.delete(`${host}/schedules/${scheduleId}`);
  return res.data;
};

// 7. 일정 복구
export const restoreSchedule = async (scheduleId) => {
  const res = await apiClient.post(`${host}/schedules/${scheduleId}/restore`);
  return res.data;
};

// 8. [테스트용] 즉시 발신 로그 등록 (make-call-test)
export const makeCallTest = async ({ to, scheduledTime }) => {
  const res = await apiClient.post(`${host}/make-call-test`, { to, scheduledTime });
  return res.data;
};

// 9. [테스트용] 수신 SMS/MMS 목록 조회
export const getInboundSmsList = async () => {
  const res = await apiClient.get(`/sms/test/inbound-sms`);
  return res.data;
};

// 9-1. [테스트용] 수신+발신 통합 메시지 목록 (나/AI/수신 구분)
export const getSmsMessages = async () => {
  const res = await apiClient.get(`/sms/test/messages`);
  return res.data;
};

// 10. [테스트용] SMS 발송
export const sendSmsTest = async ({ to, message }) => {
  const res = await apiClient.post(`/sms/test/send-sms`, { to, message });
  return res.data;
};
