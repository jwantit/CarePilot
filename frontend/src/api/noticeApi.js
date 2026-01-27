import axios from 'axios';

const API_BASE_URL = "http://localhost:8080/api/notices";

export const noticeApi = {
    // 공지사항 관련
    getNotices: (page, size = 10) =>
        axios.get(`${API_BASE_URL}?page=${page}&size=${size}`),

    getNotice: (id) =>
        axios.get(`${API_BASE_URL}/${id}`),

    createNotice: (data) =>
        axios.post(API_BASE_URL, data),

    updateNotice: (id, data) =>
        axios.put(`${API_BASE_URL}/${id}`, data),

    deleteNotice: (id) =>
        axios.delete(`${API_BASE_URL}/${id}`),

    createNotice: (formData) =>
    axios.post(API_BASE_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),

    // 댓글 관련
    getComments: (noticeId) =>
        axios.get(`${API_BASE_URL}/${noticeId}/comments`),

    createComment: (noticeId, data) =>
        axios.post(`${API_BASE_URL}/${noticeId}/comments`, data),

    updateComment: (commentId, data) =>
        axios.put(`${API_BASE_URL}/comments/${commentId}`, data),

    deleteComment: (commentId) =>
        axios.delete(`${API_BASE_URL}/comments/${commentId}`),
};