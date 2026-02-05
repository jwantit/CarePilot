import React, { useState, useMemo, useEffect } from 'react';
import { X, AlignLeft, Tag, Search, UserPlus, CheckCircle2, BookOpen, Loader2 } from 'lucide-react';
//------- Redux 연결 추가 -------
import { useDispatch, useSelector } from 'react-redux';
import { fetchCareTargets } from '../../store/slices/careTargetSlice';
//------------------------------
import { getScenarioList, createCareGroup } from '../../api/caretarget/careTargetGroupApi';
import { useAuth } from '../../hooks/useAuth';
import { getRiskLevelLabel } from '../../utils/riskLevelStyles';

const CreateGroupModal = ({ isOpen, onClose, organizationId}) => {
  const { user } = useAuth();
  const userId = user?.userId;
  
  //------- Redux Hooks 사용 -------
  const dispatch = useDispatch();
  const { list: patients, loading: reduxLoading } = useSelector((state) => state.careTarget);
  //------------------------------

  const [formData, setFormData] = useState({ 
    careTargetId: [],
    scenarioId: null,
    organizationId: organizationId,
    groupName: "",
    groupDescription: '', 
    groupStatus: true, 
    userId: userId
  });
  
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatients, setSelectedPatients] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setLoading(true);
        try {
          // 시나리오 리스트는 기존 API 호출 유지
          const scenarioRes = await getScenarioList(organizationId || 1);
          setScenarios(Array.isArray(scenarioRes) ? scenarioRes : (scenarioRes.data || []));

          //------- 환자 목록은 리덕스 Thunk 호출 (필터/검색어 없이 전체 요청) -------
          dispatch(fetchCareTargets({ 
            organizationId: organizationId || 1
          }));
          //------------------------------------------------------------------
        } catch (error) {
          console.error("데이터 로드 실패:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, organizationId, dispatch]);

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        careTargetId: selectedPatients.map(p => p.careTargetId)
      };

      const response = await createCareGroup(submitData);
      
      if (response) {
        alert("그룹이 성공적으로 생성되었습니다.");
        onClose();
        window.location.reload();
      }
    } catch (error) {
      console.error("그룹 생성 실패:", error);
      alert("그룹 생성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPatients = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return patients;

    return patients.filter(p => {
      const nameMatch = p.name?.toLowerCase().includes(term);
      const ageMatch = p.age?.toString().includes(term);
      const riskMatch = p.riskLevel?.toLowerCase().includes(term);
      const diseaseMatch = p.disease?.toLowerCase().includes(term);
      
      return nameMatch || ageMatch || riskMatch || diseaseMatch;
    });
  }, [searchTerm, patients]);

  const isFormValid = useMemo(() => {
    return (
      formData.groupName.trim() !== '' &&
      formData.groupDescription.trim() !== '' &&
      formData.scenarioId !== null &&
      selectedPatients.length > 0
    );
  }, [formData, selectedPatients]);

  if (!isOpen) return null;

  const togglePatient = (patient) => {
    setSelectedPatients(prev => 
      prev.find(p => p.careTargetId === patient.careTargetId) 
        ? prev.filter(p => p.careTargetId !== patient.careTargetId) 
        : [...prev, patient]
    );
  };

  // 로딩 상태 통합 (시나리오 로딩 + 리덕스 환자 로딩)
  const isDataLoading = loading || reduxLoading;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 w-full max-w-2xl rounded-sm shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="relative px-6 py-4 text-slate-800 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
          <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-sm text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-all"><X size={20} /></button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sm bg-gradient-to-br from-teal-500/20 to-teal-600/20 text-teal-400 border border-teal-500/50 shadow-sm">
              <UserPlus size={20} />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-bold text-slate-100 tracking-tight leading-tight">새 그룹 구성</h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">모든 항목을 입력하고 대상자를 선택해주세요.</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 modal-scrollbar">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-200 ml-1">그룹 이름 *</label>
              <input 
                type="text" value={formData.groupName} 
                onChange={(e) => setFormData({...formData, groupName: e.target.value})}
                placeholder="그룹 이름을 입력하세요"
                className="w-full px-5 py-2.5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-600 rounded-sm text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-200 ml-1">그룹 설명 *</label>
              <input 
                type="text" value={formData.groupDescription}
                onChange={(e) => setFormData({...formData, groupDescription: e.target.value})}
                placeholder="그룹 설명을 입력하세요"
                className="w-full px-5 py-2.5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-600 rounded-sm text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-200 ml-1">시나리오 선택 *</label>
            <div className="max-h-32 overflow-y-auto pr-1 space-y-2 modal-scrollbar border border-slate-700 rounded-sm p-2 bg-gradient-to-br from-slate-900 to-slate-950">
              {scenarios && scenarios.length > 0 ? (
                scenarios.map((sc) => (
                  <div
                    key={sc.scenarioId}
                    onClick={() => setFormData({...formData, scenarioId: sc.scenarioId})}
                    className={`p-3 px-4 rounded-sm cursor-pointer transition-all border flex justify-between items-center shadow-sm ${
                      formData.scenarioId === sc.scenarioId 
                        ? 'border-teal-500 bg-gradient-to-br from-teal-500/20 to-teal-600/20 hover:from-teal-500/30 hover:to-teal-600/30' 
                        : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <p className={`text-sm font-bold ${formData.scenarioId === sc.scenarioId ? 'text-teal-400' : 'text-slate-200'}`}>{sc.scenarioName}</p>
                      <p className="text-xs text-slate-400 font-medium">{sc.scenarioDescription}</p>
                    </div>
                    {formData.scenarioId === sc.scenarioId && <CheckCircle2 size={16} className="text-teal-400" />}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-2">사용 가능한 시나리오가 없습니다.</p>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="block text-sm font-semibold text-slate-200 ml-1">대상자 선택 * ({selectedPatients.length}명 선택됨)</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="이름, 나이, 위험도, 질환명 검색..."
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-600 rounded-sm text-sm font-medium text-slate-200 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all shadow-sm"
              />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1 pr-1 border-t border-slate-700 modal-scrollbar">
              {isDataLoading ? (
                <div className="py-10 flex flex-col items-center text-slate-400 gap-2">
                  <Loader2 size={24} className="animate-spin text-teal-400" />
                  <p className="text-xs font-semibold">로딩 중...</p>
                </div>
              ) : filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => {
                  const isSelected = selectedPatients.some(p => p.careTargetId === patient.careTargetId);
                  
                  const isCritical = patient.riskLevel === 'CRITICAL';
                  const isHigh = patient.riskLevel === 'HIGH';
                  const isMedium = patient.riskLevel === 'MEDIUM';
                  const isLow = patient.riskLevel === 'LOW' || patient.riskLevel === 'NORMAL';
                  
                  const riskBadgeClasses = 
                    isCritical ? 'bg-gradient-to-br from-red-500/20 to-red-600/20 text-red-400 border border-red-500/50 shadow-sm' :
                    isHigh ? 'bg-gradient-to-br from-orange-500/20 to-orange-600/20 text-orange-400 border border-orange-500/50 shadow-sm' :
                    isMedium ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 text-yellow-400 border border-yellow-500/50 shadow-sm' :
                    'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 text-emerald-400 border border-emerald-500/50 shadow-sm';
                  
                  return (
                    <div 
                      key={patient.careTargetId} 
                      onClick={() => togglePatient(patient)}
                      className={`flex items-center p-3 px-5 rounded-sm cursor-pointer transition-all border shadow-sm ${
                        isSelected 
                          ? 'bg-gradient-to-r from-teal-500/20 to-teal-600/20 border-teal-500/50 hover:from-teal-500/30 hover:to-teal-600/30' 
                          : 'bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-slate-700 hover:from-slate-700/50 hover:to-slate-800/50'
                      }`}
                    >
                      <div className="flex-1 grid grid-cols-4 items-center gap-4">
                        <p className={`text-sm font-bold ${isSelected ? 'text-teal-400' : 'text-slate-200'}`}>{patient.name}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{patient.gender === 'M' || patient.gender === '남성' ? '남성' : '여성'} · {patient.age}세</p>
                        <p className="text-[11px] text-slate-400 font-medium truncate pr-2">{patient.disease || '-'}</p>
                        <div className="flex items-center">
                          <span className={`px-2 py-0.5 rounded-sm text-[10px] font-black uppercase ${riskBadgeClasses}`}>
                            {getRiskLevelLabel(patient.riskLevel) || '보통'}
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
                })
              ) : (
                <div className="text-center py-10 text-slate-400 text-sm font-medium">검색 결과가 없습니다.</div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-r from-slate-800 to-slate-900 border-t border-slate-700 shrink-0">
          <div className="min-h-[32px] flex flex-wrap gap-1.5 mb-4">
            {selectedPatients.map(p => (
              <span key={p.careTargetId} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-[10px] font-black border bg-gradient-to-br from-slate-900 to-slate-950 text-teal-400 border-teal-500/50 shadow-md">
                {p.name}
                <X size={12} className="cursor-pointer text-slate-400 hover:text-white" onClick={() => togglePatient(p)} />
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {!isFormValid && (
                <p className="text-[10px] text-center text-red-400 font-bold animate-pulse">
                    * 모든 항목을 입력하고 대상자를 최소 1명 선택해주세요.
                </p>
            )}
            <div className="flex gap-3">
              <button 
                onClick={onClose} 
                disabled={isSubmitting} 
                className="flex-1 py-2.5 bg-gradient-to-br from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 border border-slate-600 text-slate-300 rounded-sm font-semibold hover:border-slate-500 hover:text-slate-100 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                취소
              </button>
              <button 
                disabled={!isFormValid || isDataLoading || isSubmitting}
                onClick={handleSubmit}
                className={`flex-[2] py-2.5 rounded-sm font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 ${
                  !isFormValid || isDataLoading || isSubmitting 
                    ? 'bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 text-slate-400 cursor-not-allowed' 
                    : 'bg-gradient-to-br from-teal-600 to-teal-700 border border-teal-500 text-white hover:from-teal-500 hover:to-teal-600'
                }`}
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
                그룹 생성 ({selectedPatients.length}명)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;