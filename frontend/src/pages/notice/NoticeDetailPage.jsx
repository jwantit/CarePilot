import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { noticeApi } from "../../api/noticeApi";
import NoticeDetail from "../../components/notice/NoticeDetail";
import { useAuth } from "../../hooks/useAuth";
import Breadcrumb from "../../components/common/Breadcrumb";

function NoticeDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const currentUserId = user?.userId || null;

  const [selectedNotice, setSelectedNotice] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  // 게시물 상세 정보 로드
  useEffect(() => {
    const loadNotice = async () => {
      try {
        const response = await noticeApi.getNotice(id);
        setSelectedNotice(response.data);
        await loadComments(id);
      } catch (error) {
        console.error("게시물 로드 실패:", error);
        alert("게시물을 불러오는데 실패했습니다.");
        navigate("/notice");
      }
    };
    if (id) {
      loadNotice();
    }
  }, [id, navigate]);

  // 답글 작성 시 자동으로 "@유저이름 " 추가
  useEffect(() => {
    if (replyTo) {
      const parentUserName = replyTo.userName || replyTo.writerName || "익명";
      const mentionText = `@${parentUserName}`;
      const hasMention =
        commentContent.trim().startsWith(mentionText + " ") ||
        commentContent.trim().startsWith(mentionText);
      if (!hasMention) {
        setCommentContent(`${mentionText} `);
      }
    } else {
      if (commentContent && commentContent.trim().startsWith("@")) {
        const lines = commentContent.split("\n");
        if (lines[0].trim().startsWith("@")) {
          setCommentContent(commentContent.replace(/^@[^\s]+\s*/, "").trim());
        }
      }
    }
  }, [replyTo]);

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
      await noticeApi.createComment(id, commentData);
      setCommentContent("");
      setReplyTo(null);
      loadComments(id);
    } catch (error) {
      alert("댓글 등록에 실패했습니다.");
    }
  };

  const handleEdit = () => {
    navigate(`/notice/${id}/edit`);
  };

  const handleDelete = async (noticeId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await noticeApi.deleteNotice(noticeId, currentUserId);
      navigate("/notice");
    } catch (error) {
      alert("삭제 권한이 없거나 오류가 발생했습니다.");
    }
  };

  const handleBack = () => {
    navigate("/notice");
  };

  if (!selectedNotice) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ label: "공지사항", path: "/notice" }, "상세"]} />
        <div className="text-center py-12">
          <p className="text-cp-muted">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "공지사항", path: "/notice" }, "상세"]} />
      
      <NoticeDetail
        selectedNotice={selectedNotice}
        isDetailOpen={true}
        setIsDetailOpen={handleBack}
        comments={comments}
        commentContent={commentContent}
        setCommentContent={setCommentContent}
        replyTo={replyTo}
        setReplyTo={setReplyTo}
        handleCommentSubmit={handleCommentSubmit}
        loadComments={loadComments}
        currentUserId={currentUserId}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default NoticeDetailPage;

