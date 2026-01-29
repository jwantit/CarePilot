import React, { useState, useMemo, useEffect } from 'react';
import { X, AlignLeft, Tag, Search, UserPlus, CheckCircle2, BookOpen, Loader2 } from 'lucide-react';
//------- Redux 연결 추가 -------
import { useDispatch, useSelector } from 'react-redux';
import { fetchCareTargets } from '../../store/slices/careTargetSlice';
//------------------------------
import { getScenarioList, createCareGroup } from '../../api/caretarget/careTargetGroupApi';
import { useAuth } from '../../hooks/useAuth';

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
            organizationId: organizationId || 1, 
            filterStatus: 'all', 
            keyword: '' 
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="p-6 border-b border-slate-50 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">새 그룹 구성</h2>
            <p className="text-slate-500 text-xs font-medium">모든 항목을 입력하고 대상자를 선택해주세요.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400"><X size={24} /></button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider">
                <Tag size={12} style={{ color: '#008080' }} /> 그룹 이름
              </label>
              <input 
                type="text" value={formData.groupName} 
                onChange={(e) => setFormData({...formData, groupName: e.target.value})}
                placeholder="필수 입력"
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-semibold focus:ring-2 outline-none transition-all"
                style={{ '--tw-ring-color': '#008080' }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider">
                <AlignLeft size={12} style={{ color: '#008080' }} /> 그룹 설명
              </label>
              <input 
                type="text" value={formData.groupDescription}
                onChange={(e) => setFormData({...formData, groupDescription: e.target.value})}
                placeholder="필수 입력"
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-semibold focus:ring-2 outline-none transition-all"
                style={{ '--tw-ring-color': '#008080' }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                <BookOpen size={12} style={{ color: '#008080' }} /> 시나리오 선택 (필수)
            </label>
            <div className="max-h-32 overflow-y-auto pr-1 space-y-2 custom-scrollbar border rounded-2xl p-2 border-slate-50">
              {scenarios.map((sc) => (
                <div
                  key={sc.scenarioId}
                  onClick={() => setFormData({...formData, scenarioId: sc.scenarioId})}
                  className={`p-3 px-4 rounded-xl cursor-pointer transition-all border-2 flex justify-between items-center ${
                    formData.scenarioId === sc.scenarioId ? 'border-teal-500 bg-teal-50/30' : 'bg-white border-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className={`text-sm font-bold ${formData.scenarioId === sc.scenarioId ? 'text-teal-700' : 'text-slate-700'}`}>{sc.scenarioName}</p>
                    <p className="text-[11px] text-slate-400 font-medium">{sc.scenarioDescription}</p>
                  </div>
                  {formData.scenarioId === sc.scenarioId && <CheckCircle2 size={16} className="text-teal-500" />}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider">
              <UserPlus size={12} style={{ color: '#008080' }} /> 대상자 선택 (필수)
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="이름, 나이, 위험도, 질환명 검색..."
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm font-medium focus:ring-2 outline-none transition-all"
                style={{ '--tw-ring-color': '#008080' }}
              />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1 pr-1 border-t border-slate-50">
              {isDataLoading ? (
                <div className="py-10 flex flex-col items-center text-slate-300 gap-2"><Loader2 size={24} className="animate-spin text-teal-500" /></div>
              ) : filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => {
                  const isSelected = selectedPatients.some(p => p.careTargetId === patient.careTargetId);
                  
                  // ★ 수정된 부분: riskLevel이 null이면 NORMAL로 간주하여 teal 색상 적용
                  const isHighRisk = patient.riskLevel === 'HIGH' || patient.riskLevel === 'CRITICAL';
                  const isMediumRisk = patient.riskLevel === 'MEDIUM';
                  
                  const riskColor = isHighRisk ? 'bg-red-500' : isMediumRisk ? 'bg-orange-400' : 'bg-teal-400';
                  
                  return (
                    <div 
                      key={patient.careTargetId} 
                      onClick={() => togglePatient(patient)}
                      className={`flex items-center p-3 px-5 rounded-xl cursor-pointer transition-all border ${
                        isSelected ? 'border-teal-200 bg-[#f0f9f9] shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex-1 grid grid-cols-4 items-center">
                        <p className={`text-sm font-bold ${isSelected ? 'text-teal-700' : 'text-slate-700'}`}>{patient.name}</p>
                        <p className="text-[11px] text-slate-400 font-semibold">{patient.gender === 'M' || patient.gender === '남성' ? '남성' : '여성'} / {patient.age}세</p>
                        <p className="text-[11px] text-slate-500 font-bold truncate pr-2">{patient.disease || '-'}</p>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${riskColor}`} />
                          <p className={`text-[10px] font-black uppercase ${isHighRisk ? 'text-red-500' : isMediumRisk ? 'text-orange-400' : 'text-teal-500'}`}>
                            {patient.riskLevel || 'NORMAL'} 
                          </p>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 size={18} className="text-teal-600 shrink-0" />}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-slate-300 text-xs font-medium">검색 결과가 없습니다.</div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-slate-50 shrink-0">
          <div className="min-h-[32px] flex flex-wrap gap-1.5 mb-4">
            {selectedPatients.map(p => (
              <span key={p.careTargetId} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black border bg-[#f0f9f9] text-[#008080] border-[#cceded]">
                {p.name}
                <X size={12} className="cursor-pointer" onClick={() => togglePatient(p)} />
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {!isFormValid && (
                <p className="text-[10px] text-center text-red-400 font-bold animate-pulse">
                    * 모든 항목을 입력하고 대상자를 최소 1명 선택해주세요.
                </p>
            )}
            <div className="flex gap-2">
              <button onClick={onClose} disabled={isSubmitting} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-all">취소</button>
              <button 
                disabled={!isFormValid || isDataLoading || isSubmitting}
                onClick={handleSubmit}
                className={`flex-[2] py-3 font-bold rounded-xl text-sm transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2`}
                style={{ 
                  backgroundColor: !isFormValid || isDataLoading || isSubmitting ? '#f1f5f9' : '#008080',
                  color: !isFormValid || isDataLoading || isSubmitting ? '#cbd5e1' : 'white',
                  cursor: isFormValid && !isSubmitting ? 'pointer' : 'not-allowed'
                }}
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