import React from "react";
import CommentItem from "./CommentItem";
import { getFileUrl } from "../../hooks/fileHelper";

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
  onEdit,
  onDelete,
}) => {
  if (!isDetailOpen || !selectedNotice) return null;

  const isWriter = currentUserId && selectedNotice.writerId === currentUserId;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl p-8 max-h-[90vh] overflow-y-auto relative shadow-2xl">
        {/* 닫기 버튼 */}
        <button
          onClick={() => setIsDetailOpen(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-black text-2xl"
        >
          &times;
        </button>

        <h2 className="text-3xl font-bold mb-4 text-gray-800 border-b pb-4 text-left">
          {selectedNotice.title}
        </h2>
        <div className="flex gap-4 text-sm text-gray-400 mb-6 items-center justify-between">
          <div className="flex gap-4">
            <span>작성자: {selectedNotice.writerName}</span>
            <span>조회수: {selectedNotice.viewCount}</span>
            <span>
              {(() => {
                // contentModifiedAt이 있으면 게시물 내용이 실제로 수정된 것으로 간주
                // (댓글 생성/수정은 contentModifiedAt을 변경하지 않으므로 작성일 표시)
                if (selectedNotice.contentModifiedAt) {
                  return `수정일: ${new Date(selectedNotice.contentModifiedAt).toLocaleString()}`;
                } else {
                  // contentModifiedAt이 없으면 새로 작성된 게시물이므로 작성일 표시
                  return `작성일: ${new Date(selectedNotice.createdAt).toLocaleString()}`;
                }
              })()}
            </span>
          </div>
          {/* 작성자 본인만 수정/삭제 버튼 표시 */}
          {isWriter && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsDetailOpen(false);
                  onEdit(selectedNotice);
                }}
                className="text-blue-500 hover:text-blue-700 font-medium text-sm px-3 py-1 border border-blue-500 rounded hover:bg-blue-50"
              >
                수정
              </button>
              <button
                onClick={() => {
                  if (window.confirm("정말 삭제하시겠습니까?")) {
                    setIsDetailOpen(false);
                    onDelete(selectedNotice.noticeId);
                  }
                }}
                className="text-red-500 hover:text-red-700 font-medium text-sm px-3 py-1 border border-red-500 rounded hover:bg-red-50"
              >
                삭제
              </button>
            </div>
          )}
        </div>

        <div className="text-gray-700 leading-relaxed mb-10 whitespace-pre-wrap min-h-[200px] text-left">
          {selectedNotice.content}
          {/* 파일 내용 본문에 포함 (이미지/오디오) */}
          {selectedNotice.files &&
            selectedNotice.files.map((file) => {
              const isImage = file.contentType.startsWith("image/");
              const isAudio = file.contentType.startsWith("audio/");
              const displayUrl = getFileUrl(file.storagePath); // getFileUrl 사용

              if (isImage) {
                return (
                  <div key={`img-${file.fileId}`} className="mt-6 flex justify-center">
                    <img
                      src={displayUrl}
                      alt={file.originalName}
                      className="max-w-full h-auto rounded-lg shadow-sm border"
                    />
                  </div>
                );
              } else if (isAudio) {
                return (
                  <div key={`audio-${file.fileId}`} className="mt-6">
                    <audio controls src={displayUrl} className="w-full">
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                );
              }
              return null;
            })}
        </div>

        {selectedNotice.files && selectedNotice.files.length > 0 && (
          <div className="mb-10 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <h4 className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2">
              📎 첨부 파일 ({selectedNotice.files.length})
            </h4>
            <ul className="space-y-2">
              {selectedNotice.files.map((file) => (
                <li key={file.fileId} className="text-sm">
                  <a
                    href={file.fileUrl} // 서버에서 제공하는 파일 다운로드/조회 경로
                    download // download 속성 추가하여 클릭 시 다운로드
                    className="text-blue-600 hover:underline flex items-center gap-2"
                  >
                    <span>{file.originalName}</span>
                    <span className="text-xs text-gray-400">
                      ({(file.fileSize / 1024).toFixed(1)} KB)
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

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
                <span>
                  <strong>{replyTo.userName || replyTo.writerName}</strong> 님께 답글 작성 중...
                </span>
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
              className="w-full p-3 pr-24 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none resize-none h-24"
            />
            <button
              type="submit"
              disabled={!currentUserId || !commentContent.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition disabled:bg-gray-300"
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
