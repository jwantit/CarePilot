import { useState, useEffect } from 'react';
import { noticeApi } from '../api/noticeApi';

export const useNotices = () => {
    const [notices, setNotices] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedFiles, setSelectedFiles] = useState([]);

    const loadNotices = async (page = 0) => {
        try {
            const response = await noticeApi.getNotices(page);
            const { content, totalPages, number } = response.data;
            setNotices(Array.isArray(content) ? content : []);
            setTotalPages(totalPages);
            setCurrentPage(number);
        } catch (error) {
            console.error("데이터 로딩 실패:", error);
            setNotices([]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files)); // 선택한 파일들을 배열로 저장
        }
    };

    const clearFiles = () => setSelectedFiles([]);

    useEffect(() => {
        loadNotices();
    }, []);

    return {
        notices,
        currentPage,
        totalPages,
        loadNotices,
        setNotices,
        selectedFiles,
        handleFileChange,
        clearFiles
    };
};