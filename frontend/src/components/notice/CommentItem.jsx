import React, { useState } from "react";
import { noticeApi } from "../../api/noticeApi";

const CommentItem = ({
  comment,
  isChild = false,
  selectedNotice,
  loadComments,
  setReplyTo,
  setCommentContent,
  currentUserId,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState(comment.content);

  const isDeleted = comment.content === "삭제된 댓글입니다";

  // 권한 로직 : id 비교
  const isOwner = comment.userId === currentUserId;

  // 댓글 수정 로직
  const handleUpdate = async () => {
    if (!editingContent.trim()) return;
    try {
      const updateData = {
        content: editingContent,
        userId: currentUserId,
      };

      await noticeApi.updateComment(
        comment.commentId,
        updateData,
        currentUserId,
      );

      setIsEditing(false);
      loadComments(selectedNotice.noticeId);
    } catch (error) {
      alert(error.response?.data?.message || "수정 실패");
    }
  };

  // 댓글 삭제 로직
  const handleDelete = async () => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      await noticeApi.deleteComment(comment.commentId, currentUserId);
      loadComments(selectedNotice.noticeId);
    } catch (error) {
      alert(error.response?.data?.message || "삭제 실패");
    }
  };

  return (
    <div className={`${isChild ? "ml-6 mt-3" : "mb-6"}`}>
      <div
        className={`p-4 rounded-lg shadow-sm border ${isChild ? "bg-white" : "bg-gray-100"}`}
      >
        <div className="flex justify-between items-start mb-2">
          <span className="font-bold text-gray-700 text-sm">
            {isDeleted ? "(알 수 없음)" : comment.userName}
          </span>
          <div className="flex gap-2">
            <span className="text-[10px] text-gray-400">
              {comment.createdAt
                ? new Date(comment.createdAt).toLocaleString()
                : ""}
            </span>

            {/* 삭제되지 않은 댓글일 때만 수정/삭제 노출 */}
            {!isDeleted && isOwner && (
              <>
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditingContent(comment.content);
                  }}
                  className="text-[10px] text-gray-500 hover:text-blue-500 underline"
                >
                  수정
                </button>
                <button
                  onClick={handleDelete}
                  className="text-[10px] text-gray-500 hover:text-red-500 underline"
                >
                  삭제
                </button>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="mt-2">
            <textarea
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              className="w-full p-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-400"
              rows="2"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs px-2 py-1 bg-gray-200 rounded"
              >
                취소
              </button>
              <button
                onClick={handleUpdate}
                className="text-xs px-2 py-1 bg-blue-500 text-white rounded"
              >
                저장
              </button>
            </div>
          </div>
        ) : (
          <>
            <p
              className={`text-sm mb-2 ${isDeleted ? "text-gray-400 italic" : "text-gray-700"}`}
            >
              {comment.content}
            </p>
            {!isDeleted && (
              <button
                onClick={() => {
                  setReplyTo(comment.commentId);
                  setCommentContent(`@${comment.userName} `);
                  document.getElementById("comment-textarea")?.focus();
                }}
                className="text-xs text-gray-500 hover:text-blue-500 underline font-medium"
              >
                답글 달기
              </button>
            )}
          </>
        )}
      </div>

      {comment.children && comment.children.length > 0 && (
        <div className="border-l-2 border-gray-200">
          {comment.children.map((child) => (
            <CommentItem
              key={child.commentId}
              comment={child}
              isChild={true}
              selectedNotice={selectedNotice}
              loadComments={loadComments}
              setReplyTo={setReplyTo}
              setCommentContent={setCommentContent}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
