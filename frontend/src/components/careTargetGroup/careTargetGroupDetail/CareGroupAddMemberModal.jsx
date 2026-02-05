import React, { useMemo, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Search, CheckCircle2, UserPlus, Loader2, User, Activity } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../../../hooks/useAuth';
import { fetchCareTargets } from '../../../store/slices/careTargetSlice';
import { getRiskLevelLabel, getRiskLevelStyle } from '../../../utils/riskLevelStyles';

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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 w-full max-w-lg rounded-sm shadow-xl overflow-hidden flex flex-col h-[80vh]">
        {/* 헤더 */}
        <div className="relative px-6 py-4 text-slate-800 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
          <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-sm text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-all"><X size={20} /></button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sm bg-gradient-to-br from-teal-500/20 to-teal-600/20 text-teal-400 border border-teal-500/50 shadow-sm">
              <UserPlus size={20} />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-bold text-slate-100 tracking-tight leading-tight">대상자 추가</h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Select New Members Only</p>
            </div>
          </div>
        </div>

        {/* 검색창 */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-900 shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text"
              placeholder="추가할 환자 이름 검색..."
              className="w-full pl-11 pr-4 py-2.5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-600 rounded-sm text-sm font-medium text-slate-200 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* 환자 리스트 영역 */}
        <div className="flex-1 overflow-y-auto modal-scrollbar px-2">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin border-4 border-slate-700 border-t-teal-400 rounded-full" size={32} />
              <p className="text-xs font-semibold text-slate-400">로딩 중...</p>
            </div>
          ) : filteredPatients.length > 0 ? (
            <div className="p-2 space-y-1">
              {filteredPatients.map((p) => {
                const isSelected = selectedIds.includes(p.careTargetId);
                return (
                  <div 
                    key={p.careTargetId}
                    onClick={() => togglePatient(p.careTargetId)}
                    className={`flex items-center justify-between p-4 rounded-sm cursor-pointer transition-all border shadow-sm ${
                      isSelected 
                        ? 'bg-gradient-to-r from-teal-500/20 to-teal-600/20 border-teal-500/50 hover:from-teal-500/30 hover:to-teal-600/30' 
                        : 'bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-slate-700 hover:from-slate-700/50 hover:to-slate-800/50'
                    }`}
                  >
                    <div className="flex-1 flex flex-col text-left">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${isSelected ? 'text-teal-400' : 'text-slate-200'}`}>
                            {p.name}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded-sm text-[8px] font-black shadow-sm ${getRiskLevelStyle(p.riskLevel)}`}>
                            {getRiskLevelLabel(p.riskLevel) || '보통'}
                          </span>
                        </div>
                        <div className="flex items-center text-xs font-medium text-slate-400 gap-1.5 mt-0.5">
                          <span>{p.gender === 'M' || p.gender === '남성' ? '남성' : '여성'} · {p.age}세</span>
                          <span className="flex items-center gap-0.5 truncate max-w-[120px]">
                            <Activity size={10} /> {p.disease || '미등록'}
                          </span>
                        </div>
                    </div>

                    <div className={`w-6 h-6 rounded-sm flex items-center justify-center transition-all shadow-sm ${
                      isSelected 
                        ? 'bg-gradient-to-br from-teal-500 to-teal-600 border border-teal-500' 
                        : 'bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-600'
                    }`}>
                      {isSelected && <CheckCircle2 size={16} className="text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="w-20 h-20 bg-slate-900 border-2 border-slate-700 rounded flex items-center justify-center mb-5">
                <Search size={32} className="text-slate-600"/>
              </div>
              <p className="font-semibold text-sm text-slate-300 mb-2">// No patients available</p>
              <p className="text-xs text-slate-500 font-mono">추가 가능한 환자가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 shrink-0">
          <div className="flex gap-3">
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
                신규 {selectedIds.length}명 추가
              </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CareGroupAddMemberModal;