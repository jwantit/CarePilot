import { apiClient } from "./apiClient";

const host = "/notices";

export const noticeApi = {
  // 공지사항 관련
  getNotices: (page, size = 10) =>
    apiClient.get(`${host}?page=${page}&size=${size}`),

  getNotice: (noticeId) => apiClient.get(`${host}/${noticeId}`),

  createNotice: (data, userId) =>
    apiClient.post(host, data, { params: { userId } }),

  updateNotice: (noticeId, data, userId) =>
    apiClient.put(`${host}/${noticeId}`, data, { params: { userId } }),

  deleteNotice: (noticeId, userId) =>
    apiClient.delete(`${host}/${noticeId}`, { params: { userId } }),

  // 댓글 관련
  getComments: (noticeId) => apiClient.get(`${host}/${noticeId}/comments`),

  createComment: (noticeId, data) =>
    apiClient.post(`${host}/${noticeId}/comments`, data),

  updateComment: (commentId, data, userId) =>
    apiClient.put(`${host}/comments/${commentId}`, data, {
      params: { userId },
    }),

  deleteComment: (commentId, userId) =>
    apiClient.delete(`${host}/comments/${commentId}`, { params: { userId } }),
};