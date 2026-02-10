import { apiClient } from "../apiClient";

const host = `/sms`;

/** ?�신+발신 ?�합 메시지 목록 (??AI/?�신 구분, ?�젯 ?�에???�용) */
export const getSmsMessages = async () => {
  const res = await apiClient.get(`${host}/messages`);
  return res.data;
};

/** SMS 발송 (?�젯?�서 ?�용) */
export const sendSms = async ({ to, message }) => {
  const res = await apiClient.post(`${host}/send-sms`, { to, message });
  return res.data;
};

