import React, { useState } from 'react';
import { noticeApi } from '../api/noticeApi';
import { useNotices } from '../hooks/useNotices';
import Pagination from './notice/Pagination';
import CommentItem from './notice/CommentItem';

function NoticePage() {
    // 1. 커스텀 훅 사용 (목록, 페이징 상태를 여기서 관리)
    const { notices, currentPage, totalPages, loadNotices } = useNotices();

    // 2. 페이지 내부에서 관리할 최소한의 UI 상태들
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedNotice, setSelectedNotice] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const [comments, setComments] = useState([]);
    const [commentContent, setCommentContent] = useState('');
    const [replyTo, setReplyTo] = useState(null);

    // --- 비즈니스 로직 (API 계층 활용) ---

    const startEdit = (notice) => {
        setEditingId(notice.noticeId);
        setTitle(notice.title);
        setContent(notice.content);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const noticeData = {
                title, content,
                organization: { organizationId: 1 },
                user: { userId: 1 }
            };

            if (editingId) {
                await noticeApi.updateNotice(editingId, { ...noticeData, isPinned: false });
                setEditingId(null);
                alert("수정되었습니다.");
            } else {
                await noticeApi.createNotice(noticeData);
                alert("등록되었습니다.");
            }
            setTitle(''); setContent(''); setShowForm(false);
            loadNotices(currentPage);
        } catch (error) {
            alert("요청 처리 실패");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("정말 삭제할까요?")) {
            try {
                await noticeApi.deleteNotice(id);
                loadNotices(currentPage);
            } catch (error) {
                alert("삭제 실패!");
            }
        }
    };

    const loadComments = async (noticeId) => {
        try {
            const response = await noticeApi.getComments(noticeId);
            setComments(response.data);
        } catch (error) {
            console.error("댓글 로딩 실패:", error);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentContent.trim()) return;
        try {
            await noticeApi.createComment(selectedNotice.noticeId, {
                content: commentContent,
                userId: 1,
                parentId: replyTo
            });
            setCommentContent('');
            setReplyTo(null);
            loadComments(selectedNotice.noticeId);
        } catch (error) {
            alert("댓글 등록 실패");
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-8">
            <h1 className="text-4xl font-bold mb-12 text-center text-gray-800">공지사항</h1>

            <div className="flex justify-end mb-6">
                <button onClick={() => { setShowForm(!showForm); if (showForm) { setEditingId(null); setTitle(''); setContent(''); } }}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition">
                    {showForm ? "작성 취소" : "공지사항 작성"}
                </button>
            </div>

            {/* 작성 폼 (나중에 NoticeForm.jsx로 뺄 수 있는 부분) */}
            {showForm && (
                <form onSubmit={handleSubmit} className="mb-12 p-8 border rounded-xl bg-gray-50 shadow-sm border-gray-200">
                    <h2 className="text-center font-bold text-lg mb-6 text-gray-700">{editingId ? "공지사항 수정하기" : "새 공지사항 쓰기"}</h2>
                    <input className="w-full p-3 mb-4 border rounded-md outline-none" placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    <textarea className="w-full p-3 mb-4 border rounded-md h-32 outline-none" placeholder="내용" value={content} onChange={(e) => setContent(e.target.value)} required />
                    <div className="flex justify-center"><button type="submit" className="bg-blue-500 text-white px-10 py-2 rounded-md font-bold">{editingId ? "수정 완료" : "등록하기"}</button></div>
                </form>
            )}

            {/* 목록 (나중에 NoticeList.jsx로 뺄 수 있는 부분) */}
            <div className="grid gap-6">
                {notices.map((notice) => (
                    <div key={notice.noticeId} className="p-6 border rounded-lg flex justify-between items-center bg-white shadow-sm hover:shadow-md transition cursor-pointer"
                        onClick={() => { setSelectedNotice(notice); setIsDetailOpen(true); loadComments(notice.noticeId); }}>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold mb-2 text-gray-800">{notice.title}</h3>
                            <p className="text-gray-600 mb-2 truncate">{notice.content}</p>
                            <span className="text-sm text-gray-400">조회수: {notice.viewCount}</span>
                        </div>
                        <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => startEdit(notice)} className="text-blue-500 hover:text-blue-700 font-medium">수정</button>
                            <button onClick={() => handleDelete(notice.noticeId)} className="text-red-500 hover:text-red-700 font-medium">삭제</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. 분리한 Pagination 컴포넌트 적용 */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={loadNotices}
            />

            {/* 상세 모달 (생략 없이 유지) */}
            {isDetailOpen && selectedNotice && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-2xl rounded-2xl p-8 max-h-[90vh] overflow-y-auto relative shadow-2xl">
                        <button onClick={() => setIsDetailOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black text-2xl">&times;</button>
                        <h2 className="text-3xl font-bold mb-4 text-gray-800 border-b pb-4">{selectedNotice.title}</h2>
                        <div className="text-gray-600 leading-relaxed min-h-[200px] mb-8 whitespace-pre-wrap">{selectedNotice.content}</div>

                        <div className="border-t pt-6 bg-gray-50 -mx-8 px-8 pb-8">
                            <h4 className="font-bold text-lg mb-4 text-gray-700">댓글 {comments.length}개</h4>
                            <div className="mb-6">
                                {comments.length > 0 ? (
                                    comments.map(comment => (
                                        <CommentItem
                                            key={comment.commentId}
                                            comment={comment}
                                            selectedNotice={selectedNotice}
                                            loadComments={loadComments}
                                            setReplyTo={setReplyTo}
                                            setCommentContent={setCommentContent}
                                        />
                                    ))
                                ) : ( <p className="text-center text-gray-400 py-4">첫 댓글을 남겨보세요!</p> )}
                            </div>

                            <form onSubmit={handleCommentSubmit} className="relative">
                                {replyTo && (
                                    <div className="text-xs text-blue-500 mb-1 flex justify-between items-center">
                                        <span>답글 작성 중...</span>
                                        <button type="button" onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-red-500">취소</button>
                                    </div>
                                )}
                                <textarea id="comment-textarea" value={commentContent} onChange={(e) => setCommentContent(e.target.value)}
                                    placeholder={replyTo ? "답글을 입력하세요..." : "댓글을 입력하세요..."}
                                    className="w-full p-3 pr-20 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none resize-none h-20" />
                                <button type="submit" className="absolute right-2 bottom-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition">등록</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default NoticePage;