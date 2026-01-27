import { apiClient } from "./apiClient";

const host = "/notices";

export const noticeApi = {
  // 공지사항 관련
  getNotices: (page, size = 10) =>
    apiClient.get(`${host}?page=${page}&size=${size}`),

  getNotice: (id) => apiClient.get(`${host}/${id}`),

  createNotice: (data) => apiClient.post(host, data),

  updateNotice: (id, data) => apiClient.put(`${host}/${id}`, data),

  deleteNotice: (id) => apiClient.delete(`${host}/${id}`),

  createNotice: (formData) => apiClient.post(host, formData),

  // 댓글 관련
  getComments: (noticeId) => apiClient.get(`${host}/${noticeId}/comments`),

  createComment: (noticeId, data) =>
    apiClient.post(`${host}/${noticeId}/comments`, data),

  updateComment: (commentId, data) =>
    apiClient.put(`${host}/comments/${commentId}`, data),

  deleteComment: (commentId) =>
    apiClient.delete(`${host}/comments/${commentId}`),
};
