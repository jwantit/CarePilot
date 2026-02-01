import React, { useState } from "react";
import { noticeApi } from "../../api/noticeApi";

const CommentItem = ({
  comment,
  selectedNotice,
  loadComments,
  setReplyTo,
  currentUserId,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  // 댓글 삭제 로직
  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await noticeApi.deleteComment(comment.commentId, currentUserId);
      loadComments(selectedNotice.noticeId);
    } catch (error) {
      alert("삭제 권한이 없거나 오류가 발생했습니다.");
    }
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    try {
      await noticeApi.updateComment(
        comment.commentId,
        { content: editContent, userId: currentUserId },
        currentUserId,
      );
      setIsEditing(false);
      loadComments(selectedNotice.noticeId);
    } catch (error) {
      alert("수정 권한이 없거나 오류가 발생했습니다.");
    }
  };

  return (
    <div
      className={`py-4 ${comment.parentCommentId ? "ml-8 border-l-2 pl-4 border-gray-200" : "border-b"}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900 text-sm">
            {comment.writerName || "익명"}
          </span>
          {comment.parentCommentId && (
            <span className="text-blue-500 text-[10px] bg-blue-50 px-1.5 py-0.5 rounded">
              답글
            </span>
          )}
          {comment.userId === currentUserId && (
            <span className="text-[10px] text-gray-400 border border-gray-200 px-1 rounded">
              본인
            </span>
          )}
        </div>
        {comment.userId === currentUserId && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs text-gray-400 hover:text-blue-500"
            >
              {isEditing ? "취소" : "수정"}
            </button>
            <button
              onClick={handleDelete}
              className="text-xs text-gray-400 hover:text-red-500"
            >
              삭제
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="mt-2">
          <textarea
            className="w-full p-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-400"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
          <button
            onClick={handleUpdate}
            className="mt-1 bg-blue-500 text-white px-3 py-1 rounded text-xs"
          >
            수정 완료
          </button>
        </div>
      ) : (
        <>
          <p className="text-gray-700 text-sm mb-2 leading-relaxed">
            {comment.content}
          </p>
          <div className="flex items-center gap-4 text-[11px] text-gray-400">
            <span>{new Date(comment.createdAt).toLocaleString()}</span>
            <button
              onClick={() => setReplyTo(comment)}
              className="font-bold text-gray-500 hover:text-blue-500"
            >
              답글 쓰기
            </button>
          </div>
        </>
      )}

      {/* 대댓글 재귀 렌더링 로직 */}
      {comment.children && comment.children.length > 0 && (
        <div className="mt-4 space-y-2">
          {comment.children.map((child) => (
            <CommentItem
              key={child.commentId}
              comment={child}
              selectedNotice={selectedNotice}
              loadComments={loadComments}
              setReplyTo={setReplyTo}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;