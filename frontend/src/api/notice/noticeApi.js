import { apiClient } from "../apiClient";

const host = "/notices";
const commentsHost = "/notice-comments"; // ?“ê? ?„ìš© ?¸ìŠ¤??ì¶”ê?

export const noticeApi = {
  // ê³µì??¬í•­ ê´€??
  getNotices: (page, size = 10) =>
    apiClient.get(`${host}?page=${page}&size=${size}`),

  getNotice: (noticeId) => apiClient.get(`${host}/${noticeId}`),

  createNotice: (data, userId, files) => { // files ?Œë¼ë¯¸í„° ì¶”ê?
    const formData = new FormData();
    formData.append("notice", new Blob([JSON.stringify(data)], { type: "application/json" }));
    if (files) {
      files.forEach(file => formData.append("files", file));
    }
    formData.append("userId", userId);
    formData.append("organizationId", data.organizationId); // organizationId ì¶”ê? (ë°±ì—”?œì— ë§žì¶°)

    return apiClient.post(host, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  updateNotice: (noticeId, data, userId, files) => { // files ?Œë¼ë¯¸í„° ì¶”ê?
    const formData = new FormData();
    formData.append("notice", new Blob([JSON.stringify(data)], { type: "application/json" }));
    if (files) {
      files.forEach(file => formData.append("files", file));
    }
    formData.append("userId", userId);
    formData.append("organizationId", data.organizationId); // organizationId ì¶”ê? (ë°±ì—”?œì— ë§žì¶°)

    return apiClient.put(`${host}/${noticeId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  deleteNotice: (noticeId, userId) =>
    apiClient.delete(`${host}/${noticeId}`, { params: { userId } }),

  // ?“ê? ê´€??
  getComments: (noticeId) => apiClient.get(`${commentsHost}/${noticeId}/comments`),

  createComment: (noticeId, data) =>
    apiClient.post(`${commentsHost}/${noticeId}/comments`, data),

  updateComment: (commentId, data, userId) =>
    apiClient.put(`${commentsHost}/${commentId}`, data, {
      params: { userId },
    }),

  deleteComment: (commentId, userId) =>
    apiClient.delete(`${commentsHost}/${commentId}`, { params: { userId } }),

  // ?Œì¼ ?¤ìš´ë¡œë“œ ê´€??(NoticeController???µí•©)
  getAttachment: (fileId) => apiClient.get(`${host}/files/${fileId}/download`, { responseType: 'blob' }),
  getThumbnail: (fileId) => apiClient.get(`${host}/files/${fileId}/thumbnail`, { responseType: 'blob' }),
};
