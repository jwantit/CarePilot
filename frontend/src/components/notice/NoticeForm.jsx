import React from "react";
import { FileText, Plus, X, Paperclip, Trash2 } from "lucide-react";

const NoticeForm = ({
  title,
  setTitle,
  content,
  setContent,
  isPinned,
  setIsPinned,
  noticeType,
  setNoticeType,
  handleSubmit,
  editingId,
  setShowForm,
  setEditingId,
  handleFileChange,
  selectedFiles,
  existingFiles = [],
  onDeleteExistingFile,
}) => {
  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle("");
    setContent("");
    setIsPinned(false);
    setNoticeType("NORMAL");
  };

  const inputClass = "w-full p-3 border border-cp-border rounded-sm bg-cp-input text-cp-text placeholder:text-cp-muted focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all shadow-sm text-sm";
  const labelClass = "block text-sm font-bold text-cp-text mb-1.5 ml-1";
  const selectClass = "px-3 py-1.5 border border-cp-border rounded-sm bg-cp-input text-cp-text text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none cursor-pointer font-medium";

  return (
    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
      <form
        onSubmit={handleSubmit}
        className="mb-12 p-8 border border-cp-border rounded-sm bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg shadow-xl"
      >
        <div className="flex items-center gap-3 mb-8 pb-3 border-b border-cp-border">
          <FileText size={22} className="text-teal-400" />
          <h2 className="font-bold text-xl text-cp-text">
            {editingId ? "공지사항 수정하기" : "새 공지사항 작성"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-cp-muted">분류</label>
              <select
                value={noticeType}
                onChange={(e) => {
                  setNoticeType(e.target.value);
                  if (e.target.value === "NOTICE" || e.target.value === "MANUAL") {
                    setIsPinned(true);
                  } else {
                    setIsPinned(false);
                  }
                }}
                className={selectClass}
              >
                <option value="NORMAL" className="bg-cp-card">일반 게시글</option>
                <option value="NOTICE" className="bg-cp-card">공지사항</option>
                <option value="MANUAL" className="bg-cp-card">사용 매뉴얼</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  disabled={noticeType === "NOTICE" || noticeType === "MANUAL"}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-cp-bg rounded-full peer peer-checked:bg-teal-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-cp-muted after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4 peer-disabled:opacity-50"></div>
              </div>
              <span className="text-sm font-bold text-cp-muted group-hover:text-cp-text transition-colors">상단 고정</span>
            </label>
          </div>
        </div>

        <div className="space-y-5 mb-8">
          <div>
            <label className={labelClass}>제목</label>
            <input
              className={inputClass}
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>내용</label>
            <textarea
              className={`${inputClass} h-56 resize-none leading-relaxed`}
              placeholder="내용을 입력하세요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
        </div>

        {/* 파일 첨부 영역 */}
        <div className="space-y-5 mb-10">
          <div className="flex items-center gap-2 mb-1 pb-1 border-b border-cp-border text-teal-400 font-bold text-sm">
            <Paperclip size={18} /> 파일 첨부
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 새 파일 업로드 */}
            <div className="relative group">
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <label 
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-cp-border rounded-sm bg-cp-bg/30 hover:border-teal-500/50 hover:bg-cp-bg/50 cursor-pointer transition-all group"
              >
                <Plus size={28} className="text-cp-muted group-hover:text-teal-400 mb-2" />
                <span className="text-sm text-cp-muted group-hover:text-cp-text font-bold">새 파일 추가하기</span>
                <span className="text-[10px] text-cp-muted/60 mt-1">드래그하거나 클릭하여 파일을 선택하세요</span>
              </label>
            </div>

            {/* 선택된 파일 목록 및 기존 파일 */}
            <div className="space-y-2.5 max-h-48 overflow-y-auto modal-scrollbar pr-2">
              {/* 기존 파일 */}
              {editingId && existingFiles.map((file) => (
                <div key={file.fileId} className="flex items-center justify-between p-3 bg-cp-bg/50 border border-cp-border rounded-sm group/file">
                  <div className="flex items-center gap-2 truncate flex-1">
                    <Paperclip size={16} className="text-teal-500/70 shrink-0" />
                    <span className="text-xs text-cp-text truncate font-semibold">{file.originalName}</span>
                    <span className="text-[10px] text-cp-muted shrink-0 font-mono">({(file.fileSize / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteExistingFile(file.fileId)}
                    className="p-1 text-cp-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              
              {/* 새로 선택된 파일 */}
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-teal-500/5 border border-teal-500/20 rounded-sm">
                  <Paperclip size={16} className="text-teal-400 shrink-0" />
                  <span className="text-xs text-teal-200 truncate flex-1 font-semibold">{file.name}</span>
                  <span className="text-[9px] bg-teal-500/20 text-teal-400 px-1.5 py-0.5 rounded-sm font-bold shrink-0 uppercase tracking-tighter">New</span>
                </div>
              ))}

              {!editingId && selectedFiles.length === 0 && (
                <div className="h-full flex items-center justify-center border border-cp-border border-dashed rounded-sm bg-cp-bg/10 py-10">
                  <span className="text-xs text-cp-muted font-medium tracking-wide text-center">첨부된 파일이 없습니다.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-cp-border pt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="px-8 py-2.5 bg-cp-input border border-cp-border text-cp-muted rounded-sm font-bold text-base hover:bg-cp-bg hover:border-cp-border hover:text-cp-text transition-all shadow-md"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-10 py-2.5 bg-gradient-to-br from-teal-600 to-teal-700 border border-teal-500 text-white rounded-sm font-black text-base hover:from-teal-500 hover:to-teal-600 transition-all shadow-md shadow-teal-900/30"
          >
            {editingId ? "정보 수정 완료" : "공지사항 등록"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NoticeForm;
