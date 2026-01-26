import { apiClient } from "./apiClient";

const host = `/notification-config`;

export const getNotificationConfig = async (userId) => {
  const res = await apiClient.get(`${host}/${userId}`);
  return res.data;
};

export const updateNotificationConfig = async (userId, config) => {
  const res = await apiClient.put(`${host}/${userId}`, config);
  return res.data;
};
