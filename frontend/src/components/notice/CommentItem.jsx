import React, { useState } from "react";
import { noticeApi } from "../../api/notice/noticeApi";
import { User, Edit2, Trash2, Reply } from "lucide-react";

const CommentItem = ({
  comment,
  selectedNotice,
  loadComments,
  setReplyTo,
  currentUserId,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

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

  const isDeleted = comment.content === "삭제된 댓글입니다";
  const displayName = comment.userName || comment.writerName;

  return (
    <div
      className={`${comment.parentCommentId ? "ml-8 pl-5 border-l-2 border-cp-border mt-4" : "border-b border-cp-border/50 pb-6 mb-6 last:border-0"}`}
    >
      {isDeleted ? (
        <div className="text-cp-muted text-base italic py-3 bg-cp-bg/40 px-5 rounded-sm border border-cp-border">
          {comment.content}
        </div>
      ) : (
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-cp-bg border-2 border-cp-border flex items-center justify-center flex-shrink-0 shadow-lg">
            <User size={20} className="text-cp-text" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-bold text-cp-text text-base tracking-tight">
                {displayName || "익명"}
              </span>
              {comment.userId === currentUserId && (
                <span className="text-[10px] font-black text-teal-300 bg-teal-600/30 border border-teal-500/50 px-1.5 py-0.5 rounded-sm uppercase tracking-widest shadow-sm">
                  Author
                </span>
              )}
              <span className="text-xs text-cp-muted font-mono font-medium">
                {formatDateTime(comment.createdAt)}
              </span>
              {comment.userId === currentUserId && !isEditing && (
                <div className="flex gap-3 ml-auto">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-cp-muted hover:text-teal-400 transition-all transform hover:scale-110"
                    title="수정"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="text-cp-muted hover:text-red-400 transition-all transform hover:scale-110"
                    title="삭제"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="mb-5 animate-in fade-in slide-in-from-top-2 duration-200">
                <textarea
                  className="w-full p-4 border border-cp-border rounded-sm bg-cp-input text-cp-text text-base outline-none focus:ring-2 focus:ring-teal-500/50 resize-none h-28 shadow-inner leading-relaxed"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
                <div className="flex justify-end gap-3 mt-2.5">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-xs font-bold text-cp-muted hover:text-cp-text px-3 py-1.5 transition-colors"
                  >
                    취소하기
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="bg-teal-600 text-white border border-teal-500 text-xs font-black px-5 py-1.5 rounded-sm hover:bg-teal-500 transition-all shadow-lg"
                  >
                    수정 완료
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-4 text-left">
                <p className="text-cp-text text-lg leading-relaxed whitespace-pre-wrap font-medium tracking-wide">
                  {(() => {
                    const renderContentWithMentions = (text) => {
                      if (!text) return text;
                      const mentionRegex = /(@[^\s\n]+)/g;
                      const parts = text.split(mentionRegex);
                      
                      return parts.map((part, index) => {
                        if (part.match(mentionRegex)) {
                          return (
                            <span key={index} className="text-teal-400 font-bold decoration-teal-500/30 underline-offset-4">
                              {part}
                            </span>
                          );
                        }
                        return part;
                      });
                    };

                    if (comment.parentCommentId && comment.parentUserName) {
                      const mentionText = `@${comment.parentUserName}`;
                      if (comment.content.trim().startsWith(mentionText)) {
                        return renderContentWithMentions(comment.content);
                      } else {
                        return (
                          <>
                            <span className="text-teal-400 font-bold">@{comment.parentUserName}</span>{" "}
                            {renderContentWithMentions(comment.content)}
                          </>
                        );
                      }
                    } else {
                      return renderContentWithMentions(comment.content);
                    }
                  })()}
                </p>
              </div>
            )}

            <div className="text-left">
              <button
                onClick={() => setReplyTo(comment)}
                className="flex items-center gap-1.5 text-xs font-black text-cp-muted hover:text-teal-400 transition-all bg-cp-bg/80 px-3 py-1.5 rounded-sm border border-cp-border hover:border-teal-500/50 shadow-sm"
              >
                <Reply size={12} className="rotate-180" />
                답글 달기
              </button>
            </div>
          </div>
        </div>
      )}

      {comment.children && comment.children.length > 0 && (
        <div className="mt-2 space-y-4">
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