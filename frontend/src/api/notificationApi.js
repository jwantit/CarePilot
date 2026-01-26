import { apiClient } from './apiClient';

// 알림 목록 조회
export const getNotifications = async (userId) => {
  const res = await apiClient.get(`/notifications/user/${userId}`);
  return res.data;
};

// 읽지 않은 알림 조회
export const getUnreadNotifications = async (userId) => {
  const res = await apiClient.get(`/notifications/user/${userId}/unread`);
  return res.data;
};

// 읽지 않은 알림 개수
export const getUnreadCount = async (userId) => {
  const res = await apiClient.get(`/notifications/user/${userId}/unread/count`);
  return res.data;
};

// 알림 읽음 처리
export const markAsRead = async (notificationId, resolvedByUserId) => {
  const res = await apiClient.put(
    `/notifications/${notificationId}/read`,
    null,
    {
      params: {
        resolvedByUserId: resolvedByUserId,
      },
    }
  );
  return res.data;
};

// 테스트 알림 생성
export const createTestNotification = async (userId, type, title, description, severity = null) => {
  const params = {
    userId: userId,
    type: type,
    title: title,
    description: description,
  };
  
  if (severity) {
    params.severity = severity;
  }
  
  const res = await apiClient.post(`/notifications/test`, null, {
    params: params,
  });
  return res.data;
};
