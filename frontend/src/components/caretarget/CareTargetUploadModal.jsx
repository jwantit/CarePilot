import React, { useRef } from 'react';
import { X, FileText, Upload, AlertCircle } from 'lucide-react';

function CareTargetUploadModal({ 
  isOpen, 
  onClose, 
  selectedFiles, 
  setSelectedFiles, 
  onUpload, 
  isUploading 
}) {
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const allowedExtensions = ['csv', 'xlsx', 'xls'];

    const filteredFiles = files.filter(file => {
      const extension = file.name.split('.').pop().toLowerCase();
      const isValid = allowedExtensions.includes(extension);
      if (!isValid) {
        alert(`[${file.name}]은 허용되지 않는 파일 형식입니다. CSV 또는 Excel 파일만 선택해주세요.`);
      }
      return isValid;
    });

    if (filteredFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...filteredFiles]);
    }
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-sm shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-cp-border bg-cp-bg/30">
          <h3 className="text-xl font-bold text-cp-text">케어 대상자 대량 등록</h3>
          <button onClick={onClose} className="p-1 rounded-sm text-cp-muted hover:bg-cp-bg hover:text-cp-text transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* 기본 상태 설정 섹션 제거됨 */}

          <div className="mb-6 text-center p-8 border-2 border-dashed border-cp-border rounded-sm bg-cp-input/20">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              multiple 
              accept=".csv, .xlsx, .xls" 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current.click()}
              className="flex items-center gap-2 mx-auto bg-cp-input border border-teal-500/50 px-5 py-2.5 rounded-sm font-semibold text-teal-400 hover:bg-cp-bg hover:border-teal-500 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <Upload size={18} className="text-teal-400" />
              파일 선택
            </button>
            <div className="flex items-center justify-center gap-1 mt-3 text-xs text-cp-muted">
              <AlertCircle size={14} />
              <span>CSV, Excel (.xlsx, .xls) 파일만 가능합니다.</span>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between mb-3">
              <h4 className="text-sm font-bold text-cp-text">선택된 파일 ({selectedFiles.length})</h4>
              {selectedFiles.length > 0 && (
                <button onClick={() => setSelectedFiles([])} className="text-xs text-red-400 hover:text-red-300 transition-colors">전체 삭제</button>
              )}
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1 modal-scrollbar">
              {selectedFiles.length > 0 ? (
                selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-cp-input rounded-sm border border-cp-border shadow-md">
                    <FileText size={20} className="text-teal-400" />
                    <span className="text-sm font-medium text-cp-text truncate flex-1">{file.name}</span>
                    <button onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))} className="text-cp-muted hover:text-red-400 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-cp-muted text-sm border border-cp-border rounded-sm bg-cp-input/20">파일을 선택해주세요.</div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 bg-cp-input border border-cp-border text-cp-text rounded-sm font-semibold hover:bg-cp-bg hover:border-cp-border transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">취소</button>
            <button 
              onClick={onUpload}
              disabled={selectedFiles.length === 0 || isUploading}
              className="flex-1 py-3 bg-gradient-to-br from-teal-600 to-teal-700 border border-teal-500 text-white rounded-sm font-semibold hover:from-teal-500 hover:to-teal-600 disabled:bg-cp-bg/50 disabled:border-cp-border disabled:text-cp-muted transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:hover:translate-y-0"
            >
              {isUploading ? "업로드 중..." : "업로드"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CareTargetUploadModal;
