import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Check, Activity, Trash2, BookOpen, CheckCircle2 } from 'lucide-react';

const CareGroupEditModal = ({ isOpen, onClose, editData, setEditData, careList, scenarios, onSave }) => {
  
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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 w-full max-w-2xl rounded-sm shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* 헤더 */}
        <div className="relative px-6 py-4 text-slate-800 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
          <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-sm text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-all"><X size={20} /></button>
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-sm bg-gradient-to-br from-teal-500/20 to-teal-600/20 text-teal-400 border border-teal-500/50 shadow-sm">
                <Activity size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100 tracking-tight">그룹 정보 수정</h2>
                <p className="text-xs font-semibold text-red-400 mt-0.5">※ 제외할 멤버를 선택하고 상태를 변경해 주세요.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 modal-scrollbar text-left">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-200 ml-1 mb-2">그룹 이름</label>
              <input 
                type="text" 
                value={editData.groupName || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, groupName: e.target.value }))}
                className="w-full px-5 py-2.5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-600 rounded-sm text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-200 ml-1 mb-2">그룹 설명</label>
              <textarea 
                value={editData.groupDescription || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, groupDescription: e.target.value }))}
                className="w-full px-5 py-2.5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-600 rounded-sm text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 font-medium h-24 resize-none outline-none transition-all shadow-sm"
              />
            </div>

            {/* 시나리오 선택 섹션 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-200 ml-1">
                <div className="p-1.5 rounded-sm bg-gradient-to-br from-teal-500/20 to-teal-600/20 text-teal-400 border border-teal-500/50 shadow-sm">
                  <BookOpen size={14} />
                </div>
                <span>시나리오 선택</span>
              </label>
              <div className="max-h-32 overflow-y-auto space-y-2 modal-scrollbar border border-slate-700 rounded-sm p-2 bg-gradient-to-br from-slate-900 to-slate-950">
                {scenarios && scenarios.length > 0 ? (
                  scenarios.map((sc) => (
                    <div
                      key={sc.scenarioId}
                      onClick={() => setEditData(prev => ({ ...prev, scenarioId: sc.scenarioId }))}
                      className={`p-3 px-4 rounded-sm cursor-pointer transition-all border flex justify-between items-center shadow-sm ${
                        editData.scenarioId === sc.scenarioId 
                          ? 'border-teal-500 bg-gradient-to-br from-teal-500/20 to-teal-600/20 hover:from-teal-500/30 hover:to-teal-600/30' 
                          : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className={`text-sm font-bold ${editData.scenarioId === sc.scenarioId ? 'text-teal-400' : 'text-slate-200'}`}>
                          {sc.scenarioName}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">{sc.scenarioDescription}</p>
                      </div>
                      {editData.scenarioId === sc.scenarioId && <CheckCircle2 size={16} className="text-teal-400" />}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-2">사용 가능한 시나리오가 없습니다.</p>
                )}
              </div>
            </div>

            {/* ✅ 다시 추가된 활성/비활성 토글 섹션 */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-br from-slate-900 to-slate-950 rounded-sm border border-slate-700 shadow-md">
              <span className="text-sm font-semibold text-slate-200">그룹 스케줄 상태</span>
              <div className="flex p-1 bg-gradient-to-br from-slate-800 to-slate-900 rounded-sm border border-slate-700 shadow-sm">
                <button 
                  type="button"
                  onClick={() => setEditData(prev => ({ ...prev, groupStatus: true }))}
                  className={`px-6 py-2 rounded-sm text-sm font-semibold transition-all ${
                    editData.groupStatus 
                      ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white border border-teal-500 shadow-md' 
                      : 'text-slate-400 border border-transparent'
                  }`}
                >활성</button>
                <button 
                  type="button"
                  onClick={() => setEditData(prev => ({ ...prev, groupStatus: false }))}
                  className={`px-6 py-2 rounded-sm text-sm font-semibold transition-all ${
                    !editData.groupStatus 
                      ? 'bg-gradient-to-br from-slate-600 to-slate-700 text-white border border-slate-500 shadow-md' 
                      : 'text-slate-400 border border-transparent'
                  }`}
                >비활성</button>
              </div>
            </div>
          </div>

          {/* 멤버 제외 관리 */}
          <div className="space-y-3">
            <div className="flex justify-between items-end ml-1">
              <label className="text-sm font-semibold text-slate-200">멤버 제외 관리</label>
              <span className="text-xs font-bold text-red-400 bg-gradient-to-br from-red-500/20 to-red-600/20 px-2.5 py-1 rounded-sm border border-red-500/50 shadow-sm">
                제외 선택: {editData.careTargetIds?.length || 0}명
              </span>
            </div>
            <div className="border border-slate-700 rounded-sm overflow-hidden max-h-72 overflow-y-auto bg-gradient-to-br from-slate-900 to-slate-950 shadow-inner modal-scrollbar">
              {careList?.map((p) => {
                const isSelected = editData.careTargetIds?.includes(p.careTargetId);
                return (
                  <div 
                    key={p.careTargetId}
                    onClick={() => toggleMemberSelection(p.careTargetId)}
                    className={`flex items-center justify-between p-4 cursor-pointer border-b border-slate-700 last:border-0 transition-all ${
                      isSelected 
                        ? 'bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30' 
                        : 'bg-gradient-to-r from-slate-800/50 to-slate-900/50 hover:from-slate-700/50 hover:to-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-6 h-6 rounded-sm border flex items-center justify-center transition-all shadow-sm ${
                        isSelected 
                          ? 'bg-gradient-to-br from-red-500 to-red-600 border-red-500' 
                          : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600'
                      }`}>
                        {isSelected && <Check size={14} className="text-white" strokeWidth={4} />}
                      </div>
                      <div className="flex flex-col min-w-[80px]">
                        <span className={`font-bold text-sm ${isSelected ? 'text-red-400' : 'text-slate-200'}`}>{p.name}</span>
                        <span className="text-xs text-slate-400">{p.gender} | {p.age}세</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-1 text-red-400">
                        <Trash2 size={12} />
                        <span className="text-[10px] font-bold">제외 예정</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="p-6 bg-gradient-to-r from-slate-800 to-slate-900 border-t border-slate-700 flex gap-3 shrink-0">
          <button 
            onClick={onClose} 
            className="flex-1 py-2.5 bg-gradient-to-br from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 border border-slate-600 text-slate-300 rounded-sm font-semibold hover:border-slate-500 hover:text-slate-100 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            취소
          </button>
          <button 
            onClick={onSave} 
            className="flex-[2] py-2.5 bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 border border-teal-500 text-white rounded-sm font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
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