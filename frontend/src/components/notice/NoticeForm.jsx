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

  const inputClass = "w-full p-3 border border-slate-600 rounded-sm bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all shadow-sm text-sm";
  const labelClass = "block text-sm font-bold text-slate-200 mb-1.5 ml-1";
  const selectClass = "px-3 py-1.5 border border-slate-600 rounded-sm bg-slate-900 text-slate-100 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none cursor-pointer font-medium";

  return (
    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
      <form
        onSubmit={handleSubmit}
        className="mb-12 p-8 border border-slate-700 rounded-sm bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-8 pb-3 border-b border-slate-700">
          <FileText size={22} className="text-teal-400" />
          <h2 className="font-bold text-xl text-slate-100">
            {editingId ? "공지사항 수정하기" : "새 공지사항 작성"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-slate-400">분류</label>
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
                <option value="NORMAL" className="bg-slate-900">일반 게시글</option>
                <option value="NOTICE" className="bg-slate-900">공지사항</option>
                <option value="MANUAL" className="bg-slate-900">사용 매뉴얼</option>
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
                <div className="w-9 h-5 bg-slate-700 rounded-full peer peer-checked:bg-teal-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4 peer-disabled:opacity-50"></div>
              </div>
              <span className="text-sm font-bold text-slate-400 group-hover:text-slate-200 transition-colors">상단 고정</span>
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
          <div className="flex items-center gap-2 mb-1 pb-1 border-b border-slate-700 text-teal-400 font-bold text-sm">
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
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-sm bg-slate-900/30 hover:border-teal-500/50 hover:bg-slate-900/50 cursor-pointer transition-all group"
              >
                <Plus size={28} className="text-slate-500 group-hover:text-teal-400 mb-2" />
                <span className="text-sm text-slate-400 group-hover:text-slate-200 font-bold">새 파일 추가하기</span>
                <span className="text-[10px] text-slate-600 mt-1">드래그하거나 클릭하여 파일을 선택하세요</span>
              </label>
            </div>

            {/* 선택된 파일 목록 및 기존 파일 */}
            <div className="space-y-2.5 max-h-48 overflow-y-auto modal-scrollbar pr-2">
              {/* 기존 파일 */}
              {editingId && existingFiles.map((file) => (
                <div key={file.fileId} className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700 rounded-sm group/file">
                  <div className="flex items-center gap-2 truncate flex-1">
                    <Paperclip size={16} className="text-teal-500/70 shrink-0" />
                    <span className="text-xs text-slate-300 truncate font-semibold">{file.originalName}</span>
                    <span className="text-[10px] text-slate-500 shrink-0 font-mono">({(file.fileSize / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteExistingFile(file.fileId)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
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
                <div className="h-full flex items-center justify-center border border-slate-700 border-dashed rounded-sm bg-slate-900/10 py-10">
                  <span className="text-xs text-slate-600 font-medium tracking-wide text-center">첨부된 파일이 없습니다.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-700 pt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="px-8 py-2.5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700 text-slate-400 rounded-sm font-bold text-base hover:from-slate-800 hover:to-slate-900 hover:border-slate-500 hover:text-slate-200 transition-all shadow-md"
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
