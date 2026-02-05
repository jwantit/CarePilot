import { apiClient } from "./apiClient";

const host = `/calls`;

// 1. 통화 이력 목록 조회
export const getCallHistory = async (organizationId) => {
  const res = await apiClient.get(`${host}/${organizationId}/history`);
  return res.data;
};

// 2. 통화 상세 정보 조회
export const getCallDetail = async (organizationId, callId) => {
  const res = await apiClient.get(`${host}/${organizationId}/${callId}`);
  return res.data;
};

// 3. 다가올 일정 조회
export const getUpcomingSchedules = async (organizationId) => {
  const res = await apiClient.get(
    `${host}/${organizationId}/schedules/upcoming`,
  );
  return res.data;
};

// 4. 새로운 일정 등록
export const createSchedule = async (organizationId, scheduleData) => {
  const res = await apiClient.post(
    `${host}/${organizationId}/schedules`,
    scheduleData,
  );
  return res.data;
};

// 5. 일정 수정
export const updateSchedule = async (
  organizationId,
  scheduleId,
  scheduleData,
) => {
  const res = await apiClient.put(
    `${host}/${organizationId}/schedules/${scheduleId}`,
    scheduleData,
  );
  return res.data;
};

// 6. 일정 삭제 (Soft delete)
export const deleteSchedule = async (organizationId, scheduleId) => {
  const res = await apiClient.delete(
    `${host}/${organizationId}/schedules/${scheduleId}`,
  );
  return res.data;
};

// 7. 일정 복구
export const restoreSchedule = async (organizationId, scheduleId) => {
  const res = await apiClient.post(
    `${host}/${organizationId}/schedules/${scheduleId}/restore`,
  );
  return res.data;
};

// 8. [테스트용] 즉시 발신 로그 등록 (make-call-test)
export const makeCallTest = async ({ to, scheduledTime }) => {
  // const res = await apiClient.post(`${host}/make-call-test`, {
  //   to,
  //   scheduledTime,
  // });
  // return res.data;
};

// 9. [테스트용] 위험 감지 알림 생성 테스트
export const testRiskDetectionNotification = async (
  careTargetId,
  riskScore = 75,
  riskLevel = "HIGH",
) => {
  const res = await apiClient.post(`${host}/test/risk-detection`, null, {
    params: {
      careTargetId: careTargetId,
      riskScore: riskScore,
      riskLevel: riskLevel,
    },
  });
  return res.data;
};