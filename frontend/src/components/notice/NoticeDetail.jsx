import React from "react";
import CommentItem from "./CommentItem";

const NoticeDetail = ({
  selectedNotice,
  isDetailOpen,
  setIsDetailOpen,
  comments,
  commentContent,
  setCommentContent,
  replyTo,
  setReplyTo,
  handleCommentSubmit,
  loadComments,
  currentUserId,
}) => {
  if (!isDetailOpen || !selectedNotice) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl p-8 max-h-[90vh] overflow-y-auto relative shadow-2xl">
        {/* 닫기 버튼 */}
        <button
          onClick={() => setIsDetailOpen(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-black text-2xl"
        >
          &times;
        </button>

        <h2 className="text-3xl font-bold mb-4 text-gray-800 border-b pb-4">
          {selectedNotice.title}
        </h2>
        <div className="flex gap-4 text-sm text-gray-400 mb-6">
          <span>작성자: {selectedNotice.writerName}</span>
          <span>조회수: {selectedNotice.viewCount}</span>
          <span>
            작성일: {new Date(selectedNotice.createdAt).toLocaleString()}
          </span>
        </div>

        <div className="text-gray-700 leading-relaxed mb-10 whitespace-pre-wrap min-h-[200px]">
          {selectedNotice.content}
        </div>

        {/* 댓글 섹션 */}
        <div className="border-t pt-8">
          <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
            댓글 <span className="text-blue-500">{comments.length}</span>
          </h3>

          <div className="space-y-2 mb-8">
            {comments.map((comment) => (
              <CommentItem
                key={comment.commentId}
                comment={comment}
                selectedNotice={selectedNotice}
                loadComments={loadComments}
                setReplyTo={setReplyTo}
                currentUserId={currentUserId}
              />
            ))}
          </div>

          {/* 댓글 작성 폼 */}
          <form onSubmit={handleCommentSubmit} className="relative">
            {/* 답글(대댓글) 작성 시 UI 처리 */}
            {replyTo && (
              <div className="text-xs text-blue-500 mb-1 flex justify-between items-center bg-blue-50 p-2 rounded">
                <span><strong>{replyTo.writerName}</strong> 님께 답글 작성 중...</span>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="text-gray-400 hover:text-red-500 font-bold"
                >
                  취소
                </button>
              </div>
            )}
            <textarea
              id="comment-textarea"
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder={
                !currentUserId
                  ? "로그인이 필요한 서비스입니다."
                  : replyTo
                    ? "답글을 입력하세요..."
                    : "댓글을 입력하세요..."
              }
              disabled={!currentUserId}
              className="w-full p-3 pr-20 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none resize-none h-24"
            />
            <button
              type="submit"
              disabled={!currentUserId || !commentContent.trim()}
              className="absolute right-2 bottom-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition disabled:bg-gray-300"
            >
              등록
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NoticeDetail;