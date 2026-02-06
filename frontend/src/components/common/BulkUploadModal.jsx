import React, { useRef } from "react";
import { X, FileText, Upload, AlertCircle } from "lucide-react";

/**
 * 공용 CSV/Excel 업로드 모달
 * - 파일 선택/리스트/삭제/업로드 버튼 제공
 * - 화면별 옵션 UI는 optionSlot으로 주입
 */
function BulkUploadModal({
  isOpen,
  onClose,
  title = "대량 등록",
  description,
  selectedFiles,
  setSelectedFiles,
  onUpload,
  isUploading,
  accept = ".csv, .xlsx, .xls",
  allowedExtensions = ["csv", "xlsx", "xls"],
  optionSlot = null,
}) {
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);

    const filteredFiles = files.filter((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      const isValid = extension && allowedExtensions.includes(extension);
      if (!isValid) {
        // eslint-disable-next-line no-alert
        alert(
          `[${file.name}]은 허용되지 않는 파일 형식입니다. (${allowedExtensions.join(
            ", ",
          )})`,
        );
      }
      return isValid;
    });

    if (filteredFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...filteredFiles]);
    }
    e.target.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-sm shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-5 border-b border-cp-border bg-gradient-to-r from-cp-card to-cp-bg">
          <h3 className="text-xl font-bold text-cp-text flex items-center gap-2">
            <Upload size={24} className="text-teal-400" />
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-cp-muted hover:bg-cp-bg hover:text-cp-text transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {description && (
            <p className="text-sm text-cp-muted mb-6">{description}</p>
          )}

          {optionSlot}

          <div className="mb-6 text-center p-8 border-2 border-dashed border-cp-border rounded-sm bg-cp-input hover:border-teal-500/50 transition-all cursor-pointer group shadow-inner">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept={accept}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 mx-auto bg-cp-input border border-cp-border px-6 py-3 rounded-sm font-semibold text-teal-400 hover:bg-cp-bg hover:border-teal-500 transition-all shadow-md group-hover:scale-105"
            >
              <Upload size={18} className="text-teal-400" />
              파일 선택하기
            </button>
            <div className="flex items-center justify-center gap-1 mt-4 text-xs text-cp-muted">
              <AlertCircle size={14} />
              <span>CSV, Excel (.xlsx, .xls) 파일만 가능합니다.</span>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between mb-3 items-center">
              <h4 className="text-sm font-bold text-cp-text flex items-center gap-2">
                <FileText size={16} className="text-teal-400" />
                선택된 파일 ({selectedFiles.length})
              </h4>
              {selectedFiles.length > 0 && (
                <button
                  onClick={() => setSelectedFiles([])}
                  className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors bg-red-500/5 px-2 py-1 rounded-sm border border-red-500/20"
                >
                  전체 삭제
                </button>
              )}
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1 modal-scrollbar">
              {selectedFiles.length > 0 ? (
                selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-cp-input rounded-sm border border-cp-border shadow-md group/item"
                  >
                    <div className="p-2 bg-cp-bg rounded-sm">
                      <FileText size={16} className="text-teal-400" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium text-cp-text truncate">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-cp-muted font-medium">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setSelectedFiles(
                          selectedFiles.filter((_, i) => i !== idx),
                        )
                      }
                      className="p-1 text-cp-muted hover:text-red-400 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-cp-muted text-sm border border-cp-border border-dashed rounded-sm bg-cp-bg/30">
                  파일을 선택하거나 드래그하여 추가하세요.
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-cp-input border border-cp-border text-cp-muted rounded-sm font-semibold hover:bg-cp-bg hover:text-cp-text transition-all shadow-md"
            >
              취소
            </button>
            <button
              onClick={onUpload}
              disabled={selectedFiles.length === 0 || isUploading}
              className="flex-1 py-3 bg-gradient-to-br from-teal-600 to-teal-700 border border-teal-500 text-white rounded-sm font-semibold hover:from-teal-500 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              {isUploading ? "업로드 중..." : "업로드 시작"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BulkUploadModal;
