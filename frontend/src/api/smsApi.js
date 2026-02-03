import { apiClient } from "./apiClient";

const host = `/sms`;

/** 수신 SMS/MMS 목록 조회 */
export const getInboundSmsList = async () => {
  const res = await apiClient.get(`${host}/test/inbound-sms`);
  return res.data;
};

/** 수신+발신 통합 메시지 목록 (나/AI/수신 구분, 위젯 등에서 사용) */
export const getSmsMessages = async () => {
  const res = await apiClient.get(`${host}/test/messages`);
  return res.data;
};

/** SMS 발송 (위젯에서 사용) */
export const sendSms = async ({ to, message }) => {
  const res = await apiClient.post(`${host}/test/send-sms`, { to, message });
  return res.data;
};
