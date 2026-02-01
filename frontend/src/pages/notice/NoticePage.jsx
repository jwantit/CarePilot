import React, { useState } from "react";
import { noticeApi } from "../../api/noticeApi";
import { useNotices } from "../../hooks/useNotices";
import Pagination from "../../components/notice/Pagination";
import NoticeList from "../../components/notice/NoticeList";
import NoticeForm from "../../components/notice/NoticeForm";
import NoticeDetail from "../../components/notice/NoticeDetail";
import { useAuth } from "../../hooks/useAuth";

function NoticePage() {
  // 1. 커스텀 훅 사용 (목록, 페이징 상태를 여기서 관리)
  const { notices, currentPage, totalPages, loadNotices } = useNotices();
  const { user } = useAuth();
  const currentUserId = user?.userId || null;
  const currentOrgId = user?.organizationId || null; // 페이지 내부에서 관리 할 최소한의 UI 상태

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUserId) return alert("로그인이 필요합니다.");

    const noticeData = {
      title,
      content,
      isPinned,
      organizationId: currentOrgId,
    };
    try {
      if (editingId) {
        await noticeApi.updateNotice(editingId, noticeData, currentUserId);
      } else {
        await noticeApi.createNotice(noticeData, currentUserId);
      } // 상태 초기화 및 목록 새로고침

      setShowForm(false);
      setEditingId(null);
      setTitle("");
      setContent("");
      setIsPinned(false);
      loadNotices(currentPage);
    } catch (error) {
      console.error("저장 실패:", error);
      alert("공지사항 저장 중 오류가 발생했습니다.");
    }
  };

  const handleEdit = (notice) => {
    setEditingId(notice.noticeId);
    setTitle(notice.title);
    setContent(notice.content);
    setIsPinned(notice.isPinned || false);
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (noticeId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      // 삭제 시 권한 확인을 위해 userId 전달
      await noticeApi.deleteNotice(noticeId, currentUserId);
      loadNotices(currentPage);
    } catch (error) {
      alert("삭제 권한이 없거나 오류가 발생했습니다.");
    }
  };

  const handleDetail = async (notice) => {
    try {
      // 서버에 상세 조회 요청 (백엔드에서 조회수가 +1)
      const response = await noticeApi.getNotice(notice.noticeId);
      setSelectedNotice(response.data);
      await loadComments(notice.noticeId);
      setIsDetailOpen(true);
    } catch (error) {
      alert("상세 정보를 가져오는데 실패했습니다.");
    }
  };

  const loadComments = async (noticeId) => {
    try {
      const response = await noticeApi.getComments(noticeId);
      setComments(response.data);
    } catch (error) {
      console.error("댓글 로드 실패:", error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    const commentData = {
      content: commentContent,
      userId: currentUserId,
      parentCommentId: replyTo ? replyTo.commentId : null,
    };

    try {
      await noticeApi.createComment(selectedNotice.noticeId, commentData);
      setCommentContent("");
      setReplyTo(null);
      loadComments(selectedNotice.noticeId);
    } catch (error) {
      alert("댓글 등록에 실패했습니다.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
           {" "}
      <header className="flex justify-between items-center mb-10">
               {" "}
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                    공지사항        {" "}
        </h1>
               {" "}
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setTitle("");
            setContent("");
          }}
          className="bg-black text-white px-6 py-2.5 rounded-full font-bold hover:bg-gray-800 transition shadow-lg"
        >
                    {showForm ? "닫기" : "글쓰기"}       {" "}
        </button>
             {" "}
      </header>
           {" "}
      {showForm && (
        <NoticeForm
          title={title}
          setTitle={setTitle}
          content={content}
          setContent={setContent}
          isPinned={isPinned}
          setIsPinned={setIsPinned}
          handleSubmit={handleSubmit}
          editingId={editingId}
          setShowForm={setShowForm}
          setEditingId={setEditingId}
        />
      )}
           {" "}
      <NoticeList
        notices={notices}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDetail={handleDetail}
      />
           {" "}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={loadNotices}
      />
           {" "}
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
         {" "}
    </div>
  );
}

export default NoticePage;