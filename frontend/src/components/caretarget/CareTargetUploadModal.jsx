import React, { useRef, useState } from 'react'; // useState 추가
import { X, FileText, Upload, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

function CareTargetUploadModal({ 
  isOpen, 
  onClose, 
  selectedFiles, 
  setSelectedFiles, 
  onUpload, 
  isUploading 
}) {
  const fileInputRef = useRef(null);

  const [careStatus, setCareStatus] = useState(true);

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

  const handleUploadClick = () => {
    onUpload(careStatus); 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-800">케어 대상자 대량 등록</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-3">등록 환자 기본 상태 설정</label>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setCareStatus(true)} 
                className={`flex-1 py-2.5 rounded-lg font-medium border flex items-center justify-center gap-2 transition-all ${careStatus ? 'bg-[#008080] text-white border-[#008080]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
              >
                <CheckCircle2 size={16} /> 활성 등록
              </button>
              <button 
                type="button" 
                onClick={() => setCareStatus(false)} 
                className={`flex-1 py-2.5 rounded-lg font-medium border flex items-center justify-center gap-2 transition-all ${!careStatus ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
              >
                <XCircle size={16} /> 비활성 등록
              </button>
            </div>
            <p className="mt-2 text-[11px] text-gray-400">※ 업로드되는 모든 환자에게 해당 상태가 일괄 적용됩니다.</p>
          </div>

          <div className="mb-6 text-center p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
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
              className="flex items-center gap-2 mx-auto bg-white border border-gray-300 px-5 py-2.5 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-all shadow-sm"
            >
              <Upload size={18} className="text-[#008080]" />
              파일 선택
            </button>
            <div className="flex items-center justify-center gap-1 mt-3 text-xs text-gray-400">
              <AlertCircle size={14} />
              <span>CSV, Excel (.xlsx, .xls) 파일만 가능합니다.</span>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-700">선택된 파일 ({selectedFiles.length})</h4>
              {selectedFiles.length > 0 && (
                <button onClick={() => setSelectedFiles([])} className="text-xs text-red-500 hover:underline">전체 삭제</button>
              )}
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {selectedFiles.length > 0 ? (
                selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                    <FileText size={20} className="text-[#008080]" />
                    <span className="text-sm font-medium text-gray-700 truncate flex-1">{file.name}</span>
                    <button onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500">
                      <X size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm border border-gray-100 rounded-lg bg-white">파일을 선택해주세요.</div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200">취소</button>
            <button 
              onClick={handleUploadClick} 
              disabled={selectedFiles.length === 0 || isUploading}
              className="flex-1 py-3 bg-[#008080] text-white rounded-xl font-bold hover:bg-[#006666] disabled:bg-gray-300 transition-colors"
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