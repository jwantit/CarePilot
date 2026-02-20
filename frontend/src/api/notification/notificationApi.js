import { apiClient } from "../apiClient";

const host = `/notifications`;

// ?Œë¦¼ ëª©ë¡ ì¡°íšŒ
export const getNotifications = async (userId) => {
  const res = await apiClient.get(`${host}/user/${userId}`);
  return res.data;
};

// ?½ì? ?Šì? ?Œë¦¼ ì¡°íšŒ
export const getUnreadNotifications = async (userId) => {
  const res = await apiClient.get(`${host}/user/${userId}/unread`);
  return res.data;
};

// ?½ì? ?Šì? ?Œë¦¼ ê°œìˆ˜
export const getUnreadCount = async (userId) => {
  const res = await apiClient.get(`${host}/user/${userId}/unread/count`);
  return res.data;
};

// ?Œë¦¼ ?½ìŒ ì²˜ë¦¬
export const markAsRead = async (notificationId, resolvedByUserId) => {
  const res = await apiClient.put(`${host}/${notificationId}/read`, null, {
    params: {
      resolvedByUserId: resolvedByUserId,
    },
  });
  return res.data;
};

// ?ŒìŠ¤???Œë¦¼ ?ì„±
export const createTestNotification = async (
  userId,
  type,
  title,
  description,
  severity = null,
) => {
  const params = {
    userId: userId,
    type: type,
    title: title,
    description: description,
  };

  if (severity) {
    params.severity = severity;
  }

  const res = await apiClient.post(`${host}/test`, null, {
    params: params,
  });
  return res.data;
};

