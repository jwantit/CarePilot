import { apiClient } from "./apiClient";

const host = `/sms`;

/** 수신+발신 통합 메시지 목록 (나/AI/수신 구분, 위젯 등에서 사용) */
export const getSmsMessages = async () => {
  const res = await apiClient.get(`${host}/messages`);
  return res.data;
};

/** SMS 발송 (위젯에서 사용) */
export const sendSms = async ({ to, message }) => {
  const res = await apiClient.post(`${host}/send-sms`, { to, message });
  return res.data;
};
