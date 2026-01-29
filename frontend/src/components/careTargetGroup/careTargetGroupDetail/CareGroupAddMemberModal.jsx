import React, { useMemo, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Search, CheckCircle2, UserPlus, Loader2, User, Activity } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../../../hooks/useAuth';
import { fetchCareTargets } from '../../../store/slices/careTargetSlice';

// existingMemberIds: 이미 이 그룹에 속해있는 멤버들의 ID 배열을 추가로 받습니다.
const CareGroupAddMemberModal = ({ isOpen, onClose, selectedIds, setSelectedIds, onSave, existingMemberIds = [] }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const organizationId = user?.organizationId;

  const { list, loading } = useSelector((state) => state.careTarget);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && organizationId) {
      document.body.style.overflow = 'hidden';
      dispatch(fetchCareTargets({ organizationId }));
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, dispatch, organizationId]);

  // 3. 필터링 로직 수정 (기존 멤버 제외 + 검색어 필터)
  const filteredPatients = useMemo(() => {
    if (!list || !Array.isArray(list)) return [];
    
    const term = searchTerm.toLowerCase().trim();
    
    return list.filter(p => {
      // 1) 이미 그룹에 속한 멤버는 리스트에서 제외
      const isExistingMember = existingMemberIds.includes(p.careTargetId);
      if (isExistingMember) return false;

      // 2) 검색어가 있다면 검색 조건 확인
      if (!term) return true;
      return (
        p.name?.toLowerCase().includes(term) || 
        p.disease?.toLowerCase().includes(term)
      );
    });
  }, [searchTerm, list, existingMemberIds]);

  if (!isOpen) return null;

  const togglePatient = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const getRiskColor = (level) => {
    if (!level) return 'text-slate-400 bg-slate-50';
    const l = String(level).toUpperCase();
    if (l === 'CRITICAL' || l === 'HIGH') return 'text-red-500 bg-red-50';
    if (l === 'MEDIUM') return 'text-orange-500 bg-orange-50';
    if (l === 'LOW' || l === 'NORMAL') return 'text-teal-500 bg-teal-50';
    return 'text-slate-400 bg-slate-50';
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[80vh]">
        {/* 헤더 */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 rounded-2xl text-teal-600">
              <UserPlus size={22} />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-black text-slate-800 leading-tight">대상자 추가</h2>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5 uppercase">Select New Members Only</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* 검색창 */}
        <div className="px-6 py-4 bg-white shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="추가할 환자 이름 검색..."
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* 환자 리스트 영역 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-teal-500" size={32} />
              <p className="text-xs font-bold text-slate-400">데이터를 불러오는 중...</p>
            </div>
          ) : filteredPatients.length > 0 ? (
            <div className="p-2 space-y-1">
              {filteredPatients.map((p) => {
                const isSelected = selectedIds.includes(p.careTargetId);
                return (
                  <div 
                    key={p.careTargetId}
                    onClick={() => togglePatient(p.careTargetId)}
                    className={`flex items-center justify-between p-4 rounded-3xl cursor-pointer transition-all ${
                      isSelected ? 'bg-teal-50 border-2 border-teal-200' : 'hover:bg-slate-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-colors shrink-0 ${
                        isSelected ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <User size={18} />
                      </div>
                      
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-black ${isSelected ? 'text-teal-700' : 'text-slate-700'}`}>
                            {p.name}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${getRiskColor(p.riskLevel)}`}>
                            {p.riskLevel || 'NORMAL'}
                          </span>
                        </div>
                        <div className="flex items-center text-[10px] font-bold text-slate-400 gap-1.5 mt-0.5">
                          <span>{p.gender === 'M' || p.gender === '남성' ? '남성' : '여성'} · {p.age}세</span>
                          <span className="flex items-center gap-0.5 truncate max-w-[120px]">
                            <Activity size={10} /> {p.disease || '미등록'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected ? 'bg-teal-500' : 'border-2 border-slate-200'
                    }`}>
                      {isSelected && <CheckCircle2 size={16} className="text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <Search size={40} className="mb-2 opacity-20" />
              <p className="font-bold text-sm">추가 가능한 환자가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t border-slate-50 bg-white shrink-0">
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl text-sm hover:bg-slate-200 transition-all">
              취소
            </button>
            <button 
              onClick={onSave}
              className="flex-[2] py-4 bg-teal-600 text-white font-black rounded-2xl text-sm shadow-lg shadow-teal-100 hover:bg-teal-700 transition-all active:scale-95"
            >
              신규 {selectedIds.length}명 추가 완료
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CareGroupAddMemberModal;