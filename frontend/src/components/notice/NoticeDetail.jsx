import React from "react";
import CommentItem from "./CommentItem";
import { getFileUrl } from "../../hooks/fileHelper";
import { X, User, Eye, Calendar, FileText, Paperclip, MessageSquare, Download, Edit3, Trash2 } from "lucide-react";

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-sm shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b border-cp-border bg-gradient-to-r from-cp-card to-cp-bg shrink-0">
          <div className="flex items-center gap-3">
            {selectedNotice.noticeType === "NOTICE" ? (
              <span className="bg-red-500/20 text-red-400 border border-red-500/50 text-[10px] px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider">공지</span>
            ) : selectedNotice.noticeType === "MANUAL" ? (
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 text-[10px] px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider">매뉴얼</span>
            ) : null}
            <h3 className="text-xl font-bold text-cp-text tracking-tight">{selectedNotice.title}</h3>
          </div>
          <button
            onClick={() => setIsDetailOpen(false)}
            className="p-1 rounded-sm text-cp-muted hover:bg-cp-bg hover:text-cp-text transition-all"
          >
            <X size={28} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto modal-scrollbar p-8">
          {/* 정보 바 */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-cp-border/50 text-xs text-cp-muted">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5">
                <User size={16} className="text-teal-500/70" />
                <span className="text-cp-text font-bold text-sm">{selectedNotice.writerName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye size={16} className="text-teal-500/70" />
                <span className="text-sm font-medium">조회수 <span className="text-cp-text font-mono ml-0.5">{selectedNotice.viewCount}</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={16} className="text-teal-500/70" />
                <span className="text-sm font-medium">
                  {selectedNotice.contentModifiedAt ? "수정일" : "작성일"}{" "}
                  <span className="text-cp-text font-mono ml-0.5">
                    {new Date(selectedNotice.contentModifiedAt || selectedNotice.createdAt).toLocaleString()}
                  </span>
                </span>
              </div>
            </div>

            {/* 작성자 액션 */}
            {isWriter && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsDetailOpen(false);
                    onEdit(selectedNotice);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-cp-border text-cp-text hover:bg-cp-bg hover:text-teal-400 hover:border-teal-500/50 transition-all font-bold text-xs"
                >
                  <Edit3 size={14} /> 수정
                </button>
                <button
                  onClick={() => {
                    if (window.confirm("정말 삭제하시겠습니까?")) {
                      setIsDetailOpen(false);
                      onDelete(selectedNotice.noticeId);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-cp-border text-cp-text hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50 transition-all font-bold text-xs"
                >
                  <Trash2 size={14} /> 삭제
                </button>
              </div>
            )}
          </div>

          {/* 본문 */}
          <div className="text-cp-text leading-relaxed mb-12 whitespace-pre-wrap min-h-[250px] text-lg font-medium tracking-wide">
            {selectedNotice.content}
            
            {/* 본문 포함 미디어 */}
            {selectedNotice.files && selectedNotice.files.map((file) => {
              const isImage = file.contentType.startsWith("image/");
              const isAudio = file.contentType.startsWith("audio/");
              const displayUrl = getFileUrl(file.storagePath);

              if (isImage) {
                return (
                  <div key={`img-${file.fileId}`} className="mt-8 flex justify-center">
                    <img
                      src={displayUrl}
                      alt={file.originalName}
                      className="max-w-full h-auto rounded-sm shadow-2xl border border-cp-border"
                    />
                  </div>
                );
              } else if (isAudio) {
                return (
                  <div key={`audio-${file.fileId}`} className="mt-8">
                    <div className="p-5 bg-cp-bg/50 rounded-sm border border-cp-border shadow-inner">
                      <p className="text-xs text-cp-muted mb-3 flex items-center gap-2 font-bold">
                        <FileText size={14} /> 오디오 브리핑
                      </p>
                      <audio controls src={displayUrl} className="w-full audio-dark">
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>

          {/* 첨부 파일 리스트 */}
          {selectedNotice.files && selectedNotice.files.length > 0 && (
            <div className="mb-12 p-6 bg-cp-bg/30 rounded-sm border border-cp-border/50 shadow-inner">
              <h4 className="text-sm font-black text-teal-400 mb-4 flex items-center gap-2 pb-2 border-b border-cp-border/50 uppercase tracking-widest">
                <Paperclip size={18} /> 첨부 파일 ({selectedNotice.files.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedNotice.files.map((file) => (
                  <a
                    key={file.fileId}
                    href={file.fileUrl}
                    download
                    className="flex items-center justify-between p-3.5 bg-cp-card/40 border border-cp-border rounded-sm hover:border-teal-500/50 hover:bg-cp-card/80 transition-all group shadow-sm"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="p-1.5 bg-cp-bg rounded-sm group-hover:bg-teal-500/10 transition-colors">
                        <FileText size={18} className="text-cp-muted group-hover:text-teal-400" />
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-sm text-cp-text truncate font-bold group-hover:text-teal-200">{file.originalName}</span>
                        <span className="text-[10px] text-cp-muted font-mono mt-0.5">{(file.fileSize / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                    <Download size={16} className="text-cp-muted group-hover:text-teal-400 transition-transform group-hover:-translate-y-0.5" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 댓글 섹션 */}
          <div className="border-t border-cp-border pt-10">
            <h3 className="font-black text-xl text-cp-text mb-8 flex items-center gap-3">
              <MessageSquare size={24} className="text-teal-400" />
              댓글 <span className="text-teal-400 font-mono bg-teal-500/10 px-3 py-0.5 rounded-sm border border-teal-500/30">{comments.length}</span>
            </h3>

            <div className="space-y-6 mb-10">
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
              {comments.length === 0 && (
                <div className="py-16 text-center border-2 border-dashed border-cp-border rounded-sm bg-cp-bg/20">
                  <p className="text-cp-muted text-lg font-bold tracking-wide">등록된 댓글이 없습니다.</p>
                </div>
              )}
            </div>

            {/* 댓글 작성 폼 */}
            <form onSubmit={handleCommentSubmit} className="space-y-3 mb-8">
              {replyTo && (
                <div className="text-xs text-teal-400 flex justify-between items-center bg-teal-500/10 border border-teal-500/20 p-3 rounded-sm">
                  <span className="flex items-center gap-2 font-bold">
                    <MessageSquare size={14} />
                    {replyTo.userName || replyTo.writerName} 님께 답글 작성 중...
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="text-cp-muted hover:text-red-400 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
              <div className="relative group">
                <textarea
                  id="comment-textarea"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder={
                    !currentUserId
                      ? "로그인이 필요한 서비스입니다."
                      : replyTo
                        ? "답글을 입력해주세요."
                        : "댓글을 입력해주세요."
                  }
                  disabled={!currentUserId}
                  className="w-full p-4 pr-28 border border-cp-border rounded-sm bg-cp-input text-cp-text text-lg placeholder:text-cp-muted focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none resize-none h-32 shadow-inner transition-all leading-relaxed"
                />
                <button
                  type="submit"
                  disabled={!currentUserId || !commentContent.trim()}
                  className="absolute right-3 bottom-3 bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white px-8 py-2.5 rounded-sm font-black text-sm transition-all shadow-lg border border-teal-500 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed uppercase tracking-widest"
                >
                  등록
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticeDetail;
