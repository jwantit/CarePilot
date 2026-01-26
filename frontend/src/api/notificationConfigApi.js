import axios from "axios";
import { API_SERVER_HOST } from "./notificationApi";

const host = `${API_SERVER_HOST}/api/notification-config`;

export const getNotificationConfig = async (userId) => {
  const res = await axios.get(`${host}/${userId}`);
  return res.data;
};

export const updateNotificationConfig = async (userId, config) => {
  const res = await axios.put(`${host}/${userId}`, config);
  return res.data;
};

