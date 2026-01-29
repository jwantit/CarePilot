import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Check, Activity, Trash2 } from 'lucide-react';

const CareGroupEditModal = ({ isOpen, onClose, editData, setEditData, careList, onSave }) => {
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // 모달 열 때 '제외할 사람' 리스트만 초기화 (상태값 등은 부모에서 넘겨준 값 유지)
      setEditData(prev => ({ ...prev, careTargetIds: [] }));
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]); 

  if (!isOpen) return null;

  const toggleMemberSelection = (memberId) => {
    const currentExcludedIds = editData.careTargetIds || [];
    const newIds = currentExcludedIds.includes(memberId)
      ? currentExcludedIds.filter(id => id !== memberId)
      : [...currentExcludedIds, memberId];
    
    setEditData({ ...editData, careTargetIds: newIds });
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* 헤더 */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div className="space-y-1 text-left">
            <h2 className="text-xl font-black text-slate-800">그룹 정보 수정</h2>
            <p className="text-xs font-bold text-red-500">※ 제외할 멤버를 선택하고 상태를 변경해 주세요.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
            <X size={24} />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-8 overflow-y-auto space-y-6 custom-scrollbar text-left">
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase ml-1 tracking-wider">그룹 이름</label>
              <input 
                type="text" 
                value={editData.groupName || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, groupName: e.target.value }))}
                className="w-full mt-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 font-bold text-slate-700 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase ml-1 tracking-wider">그룹 설명</label>
              <textarea 
                value={editData.groupDescription || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, groupDescription: e.target.value }))}
                className="w-full mt-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 font-bold text-slate-700 h-24 resize-none outline-none"
              />
            </div>

            {/* ✅ 다시 추가된 활성/비활성 토글 섹션 */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-sm font-bold text-slate-600">그룹 스케줄 상태</span>
              <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                <button 
                  type="button"
                  onClick={() => setEditData(prev => ({ ...prev, groupStatus: true }))}
                  className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${editData.groupStatus ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400'}`}
                >활성</button>
                <button 
                  type="button"
                  onClick={() => setEditData(prev => ({ ...prev, groupStatus: false }))}
                  className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${!editData.groupStatus ? 'bg-slate-600 text-white shadow-md' : 'text-slate-400'}`}
                >비활성</button>
              </div>
            </div>
          </div>

          {/* 멤버 제외 관리 */}
          <div className="space-y-3">
            <div className="flex justify-between items-end ml-1">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">멤버 제외 관리</label>
              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                제외 선택: {editData.careTargetIds?.length || 0}명
              </span>
            </div>
            <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-72 overflow-y-auto bg-slate-50 shadow-inner">
              {careList?.map((p) => {
                const isSelected = editData.careTargetIds?.includes(p.careTargetId);
                return (
                  <div 
                    key={p.careTargetId}
                    onClick={() => toggleMemberSelection(p.careTargetId)}
                    className={`flex items-center justify-between p-4 cursor-pointer border-b border-white last:border-0 transition-all ${isSelected ? 'bg-red-50' : 'bg-white hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${isSelected ? 'bg-red-500 border-red-500' : 'bg-white border-slate-300'}`}>
                        {isSelected && <Check size={14} className="text-white" strokeWidth={4} />}
                      </div>
                      <div className="flex flex-col min-w-[80px]">
                        <span className={`font-bold text-sm ${isSelected ? 'text-red-700' : 'text-slate-700'}`}>{p.name}</span>
                        <span className="text-[10px] text-slate-400">{p.gender} | {p.age}세</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-1 text-red-500 animate-pulse">
                        <Trash2 size={12} />
                        <span className="text-[9px] font-black">제외 예정</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black">취소</button>
          <button 
            onClick={onSave} 
            className="flex-[2] py-4 bg-teal-600 text-white rounded-2xl font-black shadow-lg hover:bg-teal-700 transition-all"
          >
            수정 완료
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CareGroupEditModal;