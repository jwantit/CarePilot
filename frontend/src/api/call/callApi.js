import { apiClient } from "../apiClient";

const host = `/calls`;

// 1. ?µí™” ?´ë ¥ ëª©ë¡ ì¡°íšŒ (?„ì²´)
export const getCallHistory = async (organizationId) => {
  const res = await apiClient.get(`${host}/${organizationId}/history`);
  return res.data;
};

// 1-1. ?µí™” ?´ë ¥ ëª©ë¡ ì¡°íšŒ (?˜ì´ì§?
export const getCallHistoryWithPaging = async (organizationId, page = 1, size = 10) => {
  const res = await apiClient.get(`${host}/${organizationId}/history/paged`, {
    params: { page, size },
  });
  return res.data;
};

// 2. ?µí™” ?ì„¸ ?•ë³´ ì¡°íšŒ
export const getCallDetail = async (organizationId, callId) => {
  const res = await apiClient.get(`${host}/${organizationId}/${callId}`);
  return res.data;
};

// 3. ?¤ê????¼ì • ì¡°íšŒ
export const getUpcomingSchedules = async (organizationId) => {
  const res = await apiClient.get(
    `${host}/${organizationId}/schedules/upcoming`,
  );
  return res.data;
};

// 4. ?ˆë¡œ???¼ì • ?±ë¡
export const createSchedule = async (organizationId, scheduleData) => {
  const res = await apiClient.post(
    `${host}/${organizationId}/schedules`,
    scheduleData,
  );
  return res.data;
};

// 5. ?¼ì • ?˜ì •
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

// 6. ?¼ì • ?? œ (Soft delete)
export const deleteSchedule = async (organizationId, scheduleId) => {
  const res = await apiClient.delete(
    `${host}/${organizationId}/schedules/${scheduleId}`,
  );
  return res.data;
};

// 7. ?¼ì • ë³µêµ¬
export const restoreSchedule = async (organizationId, scheduleId) => {
  const res = await apiClient.post(
    `${host}/${organizationId}/schedules/${scheduleId}/restore`,
  );
  return res.data;
};

// 8. [?ŒìŠ¤?¸ìš©] ì¦‰ì‹œ ë°œì‹  ë¡œê·¸ ?±ë¡ (make-call-test)
export const makeCallTest = async ({ to, scheduledTime }) => {
  // const res = await apiClient.post(`${host}/make-call-test`, {
  //   to,
  //   scheduledTime,
  // });
  // return res.data;
};

// 9. [?ŒìŠ¤?¸ìš©] ?„í—˜ ê°ì? ?Œë¦¼ ?ì„± ?ŒìŠ¤??
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
