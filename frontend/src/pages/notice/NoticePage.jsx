import React, { useState } from "react";
import { noticeApi } from "../../api/noticeApi";
import { useNotices } from "../../hooks/useNotices";
import Pagination from "../../components/notice/Pagination";
import NoticeList from "../../components/notice/NoticeList";
import NoticeForm from "../../components/notice/NoticeForm";
import NoticeDetail from "../../components/notice/NoticeDetail";

function NoticePage() {
  // 커스텀 훅 사용 (목록, 페이징 상태를 여기서 관리)
  const { notices, currentPage, totalPages, loadNotices } = useNotices();

  const [currentUserId] = useState(1); // 임시로 사용자 id를 고정함

  // 페이지 내부에서 관리 할 최소한의 UI 상태
  const [showForm, setShowForm] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);


  // 입력 필드 상태
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  // -- 비즈니스 로직 --
  // 공지사항 수정
  const startEdit = (notice) => {
    setEditingId(notice.noticeId);
    setTitle(notice.title);
    setContent(notice.content);
    setShowForm(true);
    window.scrollTo(0, 0);
  };
  // 공지사항 저장(생성/수정)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const noticeData = {
        title,
        content,
        organization: { organizationId: 1 },
        user: { userId: currentUserId },
      };

      if (editingId) {
        await noticeApi.updateNotice(editingId, {...noticeData, isPinned: false });
        alert("수정되었습니다.");
      } else {
        await noticeApi.createNotice(noticeData);
        alert("등록되었습니다.");
      }
      // 상태 초기화 및 목록 새로고침
      setTitle("");
      setContent("");
      setShowForm(false);
      setEditingId(null);
      loadNotices(currentPage);
    } catch (error) {
      alert("요청 처리 실패");
    }
  };
  // 공지사항 삭제
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
  // 상세 보기 및 댓글 불러오기
  const handleDetail = async (notice) => {
    setSelectedNotice(notice);
    setIsDetailOpen(true);
    loadComments(notice.noticeId);
  };

  const loadComments = async (noticeId) => {
    try {
      const response = await noticeApi.getComments(noticeId);
      setComments(response.data);
    } catch (error) {
      console.error("댓글 로딩 실패:", error);
    }
  };
  // 댓글 등록
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    try {
      await noticeApi.createComment(selectedNotice.noticeId, {
        content: commentContent,
        userId: currentUserId,
        parentId: replyTo,
      });
      setCommentContent("");
      setReplyTo(null);
      loadComments(selectedNotice.noticeId);
    } catch (error) {
      alert("댓글 등록 실패");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-12 text-center text-gray-800">
        공지사항
      </h1>

      <div className="flex justify-end mb-6">
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditingId(null);
              setTitle("");
              setContent("");
            }
          }}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          {showForm ? "작성 취소" : "공지사항 작성"}
        </button>
      </div>

      {/* 작성/수정 폼 컴포넌트 */}
      {showForm && (
        <NoticeForm
          title={title}
          setTitle={setTitle}
          content={content}
          setContent={setContent}
          handleSubmit={handleSubmit}
          editingId={editingId}
          setShowForm={setShowForm}
          setEditingId={setEditingId}
        />
      )}

      {/* 목록 컴포넌트 */}
      <NoticeList
        notices={notices}
        onEdit={startEdit}
        onDelete={handleDelete}
        onDetail={handleDetail}
        currentUserId={currentUserId} // 목록에서 본인 글 확인용
      />

      {/* 페이징 컴포넌트 */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={loadNotices}
      />

      {/* 상세 모달 컴포넌트 */}
      <NoticeDetail
        selectedNotice={selectedNotice}
        isDetailOpen={isDetailOpen}
        setIsDetailOpen={setIsDetailOpen}
        comments={comments}
        commentContent={commentContent}
        setCommentContent={setCommentContent}
        replyTo={replyTo}
        setReplyTo={setReplyTo}
        handleCommentSubmit={handleCommentSubmit}
        loadComments={loadComments}
        currentUserId={currentUserId}
      />
    </div>
  );
}

export default NoticePage;
