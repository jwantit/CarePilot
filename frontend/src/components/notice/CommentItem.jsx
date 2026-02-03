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

  // 날짜 포맷 함수 (2026.02.02. 14:57 형식)
  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    
    return `${year}.${month}.${day}. ${hours}:${minutes}`;
  };

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

  // 삭제된 댓글인지 확인
  const isDeleted = comment.content === "삭제된 댓글입니다";
  const displayName = comment.userName || comment.writerName;

  return (
    <div
      className={`${comment.parentCommentId ? "ml-6 pl-4" : "border-b border-gray-200 pb-3 mb-3"}`}
    >
      {isDeleted ? (
        // 삭제된 댓글: "삭제된 댓글입니다"만 표시
        <div className="text-gray-400 text-sm py-2">
          {comment.content}
        </div>
      ) : (
        // 일반 댓글: 간결한 레이아웃
        <div className="flex items-start gap-3 py-2">
          {/* 프로필 이미지 (빈 프로필) */}
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>

          <div className="flex-1">
            {/* 사용자 이름과 태그 */}
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-gray-900 text-sm">
                {displayName || "익명"}
              </span>
              {comment.userId === currentUserId && (
                <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                  작성자
                </span>
              )}
              {/* 작성 일시를 유저명 옆으로 이동 */}
              <span className="text-xs text-gray-500">
                {formatDateTime(comment.createdAt)}
              </span>
              {comment.userId === currentUserId && (
                <div className="flex gap-2 ml-auto text-xs text-gray-500">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="hover:text-blue-500"
                  >
                    수정
                  </button>
                  <button
                    onClick={handleDelete}
                    className="hover:text-red-500"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>

            {/* 댓글 내용 */}
            {isEditing ? (
              <div className="mb-2">
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
              <div className="mb-2 text-left">
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {(() => {
                    // @유저이름 패턴을 파란색으로 강조 표시하는 함수
                    const renderContentWithMentions = (text) => {
                      if (!text) return text;
                      // @로 시작하고 공백 전까지 또는 줄바꿈 전까지 매칭
                      const mentionRegex = /(@[^\s\n]+)/g;
                      const parts = text.split(mentionRegex);
                      
                      return parts.map((part, index) => {
                        if (part.match(mentionRegex)) {
                          // @로 시작하는 부분은 파란색으로 표시
                          return (
                            <span key={index} className="text-blue-500 font-medium">
                              {part}
                            </span>
                          );
                        }
                        return part;
                      });
                    };

                    // 답글인 경우 댓글 내용에 이미 @유저이름이 포함되어 있는지 확인
                    if (comment.parentCommentId && comment.parentUserName) {
                      const mentionText = `@${comment.parentUserName}`;
                      // 댓글 내용이 이미 @유저이름으로 시작하면 중복 표시하지 않음
                      if (comment.content.trim().startsWith(mentionText)) {
                        return renderContentWithMentions(comment.content);
                      } else {
                        // 댓글 내용에 @유저이름이 없으면 추가
                        return (
                          <>
                            <span className="text-blue-500 font-medium">@{comment.parentUserName}</span>{" "}
                            {renderContentWithMentions(comment.content)}
                          </>
                        );
                      }
                    } else {
                      // 일반 댓글도 @유저이름이 있으면 파란색으로 표시
                      return renderContentWithMentions(comment.content);
                    }
                  })()}
                </p>
              </div>
            )}

            {/* 답글 쓰기 버튼 (댓글 아래 좌측) */}
            <div className="text-left">
              <button
                onClick={() => setReplyTo(comment)}
                className="text-xs text-gray-500 hover:text-blue-500 font-medium"
              >
                {comment.parentCommentId ? "답글쓰기" : "답글 쓰기"}
              </button>
            </div>
          </div>
        </div>
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