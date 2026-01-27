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
  currentUserId
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

        {/* 본문 */}
        <h2 className="text-3xl font-bold mb-4 text-gray-800 border-b pb-4">
          {selectedNotice.title}
        </h2>
        <div className="text-gray-600 leading-relaxed min-h-[200px] mb-8 whitespace-pre-wrap">
          {selectedNotice.content}
        </div>

        {/* 댓글 */}
        <div className="border-t pt-6 bg-gray-50 -mx-8 px-8 pb-8">
          <h4 className="font-bold text-lg mb-4 text-gray-700">
            댓글 {comments.length}개
          </h4>
          
          <div className="mb-6">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <CommentItem
                  key={comment.commentId}
                  comment={comment}
                  selectedNotice={selectedNotice}
                  loadComments={loadComments}
                  setReplyTo={setReplyTo}
                  setCommentContent={setCommentContent}
                  currentUserId={currentUserId}
                />
              ))
            ) : (
              <p className="text-center text-gray-400 py-4">
                첫 댓글을 남겨보세요!
              </p>
            )}
          </div>

          {/* 댓글 작성 폼 */}
          <form onSubmit={handleCommentSubmit} className="relative">
            {replyTo && (
              <div className="text-xs text-blue-500 mb-1 flex justify-between items-center">
                <span>답글 작성 중...</span>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="text-gray-400 hover:text-red-500"
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
                replyTo ? "답글을 입력하세요..." : "댓글을 입력하세요..."
              }
              className="w-full p-3 pr-20 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none resize-none h-20"
            />
            <button
              type="submit"
              className="absolute right-2 bottom-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
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