import { apiClient } from "./apiClient";

const host = "/notices";
const commentsHost = "/notice-comments"; // 댓글 전용 호스트 추가

export const noticeApi = {
  // 공지사항 관련
  getNotices: (page, size = 10) =>
    apiClient.get(`${host}?page=${page}&size=${size}`),

  getNotice: (noticeId) => apiClient.get(`${host}/${noticeId}`),

  createNotice: (data, userId, files) => { // files 파라미터 추가
    const formData = new FormData();
    formData.append("notice", new Blob([JSON.stringify(data)], { type: "application/json" }));
    if (files) {
      files.forEach(file => formData.append("files", file));
    }
    formData.append("userId", userId);
    formData.append("organizationId", data.organizationId); // organizationId 추가 (백엔드에 맞춰)

    return apiClient.post(host, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  updateNotice: (noticeId, data, userId, files) => { // files 파라미터 추가
    const formData = new FormData();
    formData.append("notice", new Blob([JSON.stringify(data)], { type: "application/json" }));
    if (files) {
      files.forEach(file => formData.append("files", file));
    }
    formData.append("userId", userId);
    formData.append("organizationId", data.organizationId); // organizationId 추가 (백엔드에 맞춰)

    return apiClient.put(`${host}/${noticeId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  deleteNotice: (noticeId, userId) =>
    apiClient.delete(`${host}/${noticeId}`, { params: { userId } }),

  // 댓글 관련
  getComments: (noticeId) => apiClient.get(`${commentsHost}/${noticeId}/comments`),

  createComment: (noticeId, data) =>
    apiClient.post(`${commentsHost}/${noticeId}/comments`, data),

  updateComment: (commentId, data, userId) =>
    apiClient.put(`${commentsHost}/${commentId}`, data, {
      params: { userId },
    }),

  deleteComment: (commentId, userId) =>
    apiClient.delete(`${commentsHost}/${commentId}`, { params: { userId } }),

  // 파일 다운로드 관련 (NoticeController에 통합)
  getAttachment: (fileId) => apiClient.get(`${host}/files/${fileId}/download`, { responseType: 'blob' }),
  getThumbnail: (fileId) => apiClient.get(`${host}/files/${fileId}/thumbnail`, { responseType: 'blob' }),
};