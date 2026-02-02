import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Phone, Calendar, ClipboardList, User, Edit3, Trash2, List, UserPlus, Activity } from 'lucide-react';
import { getCareGroupDetail, deleteCareGroup, updateCareGroup, addCareTargetGroup, getScenarioList } from '../../api/caretarget/careTargetGroupApi';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../../components/common/Loading';
import CareGroupEditModal from '../../components/careTargetGroup/careTargetGroupDetail/CareGroupEditModal';
import CareGroupAddMemberModal from '../../components/careTargetGroup/careTargetGroupDetail/CareGroupAddMemberModal';
import CareGroupCallSchedule from '../../components/careTargetGroup/careTargetGroupDetail/CareGroupCallSchedule';
// 추가된 컴포넌트 임포트

const CareTargetGroupDetailPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const organizationId = user?.organizationId;
  const role = user?.role;

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scenarios, setScenarios] = useState([]);

  // 1. 그룹 정보 수정 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    careGroupId: '',
    groupName: '',
    groupDescription: '',
    groupStatus: true,
    scenarioId: null,
    careTargetIds: [] // 제외할 ID들이 담기는 배열
  });

  // 2. 대상자 추가 모달 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]); 

  const fetchDetail = async () => {
    if (!organizationId || !groupId) return;
    try {
      setLoading(true);
      const data = await getCareGroupDetail(organizationId, groupId);
      setFormData(data);
      
      // 시나리오 리스트 조회
      const scenarioRes = await getScenarioList(organizationId);
      setScenarios(Array.isArray(scenarioRes) ? scenarioRes : (scenarioRes.data || []));
    } catch (error) {
      console.error("그룹 상세 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [organizationId, groupId]);

  // 수정 모달을 열 때
  const handleOpenEditModal = () => {
    if (!formData) return;
    setEditData({
      careGroupId: Number(groupId),
      groupName: formData.groupName,
      groupDescription: formData.groupDescription,
      groupStatus: formData.groupStatus,
      scenarioId: formData.scenarioId,
      careTargetIds: [], // 모달 열 때 제외 리스트 초기화
    });
    setIsEditModalOpen(true);
  };

  /**
   * 1. 그룹 정보 수정 제출 (필터링 로직 포함)
   */
  const handleUpdateSubmit = async () => {
    try {
      setLoading(true);
  
      // ✅ 사용자가 모달에서 체크한 ID 리스트 (제외할 사람들)
      // 선택을 안했다면 빈 배열 [] 이 전송됩니다.
      const excludedIds = editData.careTargetIds || [];
  
      const requestData = {
        organizationId: Number(organizationId),
        careGroupId: Number(groupId),
        groupName: editData.groupName,
        groupDescription: editData.groupDescription,
        groupStatus: editData.groupStatus,
        scenarioId: editData.scenarioId,
        careTargetIds: excludedIds 
      };
  
      console.log("전송 데이터(제외 대상):", requestData);
  
      const result = await updateCareGroup(requestData);
      setFormData(result);
      alert("성공적으로 수정되었습니다.");
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("수정 실패:", error);
      alert(error.response?.data?.message || "수정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 2. 대상자(멤버) 추가 제출
   */
  const handleAddMemberSubmit = async (newAddedIds) => {
    if (!newAddedIds || newAddedIds.length === 0) {
      alert("추가할 대상자를 선택해주세요.");
      return;
    }

    try {
      setLoading(true);
      const requestData = {
        organizationId: Number(organizationId),
        careGroupId: Number(groupId),
        careTargetIds: newAddedIds 
      };

      const result = await addCareTargetGroup(requestData);
      setFormData(result); 
      
      alert(`신규 멤버 ${newAddedIds.length}명이 추가되었습니다.`);
      setIsAddModalOpen(false);
      setSelectedIds([]); 
    } catch (error) {
      console.error("멤버 추가 실패:", error);
      alert(error.response?.data?.message || "멤버 추가 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("정말 이 그룹을 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.")) {
      try {
        setLoading(true);
        await deleteCareGroup(groupId);
        alert("그룹이 삭제되었습니다."); 
        navigate('/care-target-group');
      } catch (error) {
        console.error("삭제 실패:", error);
        alert("삭제 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && !formData) return <Loading />;
  if (!formData) return <div className="p-8 text-center text-slate-500 font-bold">데이터를 불러올 수 없습니다.</div>;

  const getLevelColor = (level) => {
    const l = level?.toUpperCase();
    if (l === 'CRITICAL' || l === 'URGENT') return 'bg-red-100 text-red-600';
    if (l === 'HIGH') return 'bg-orange-100 text-orange-600';
    if (l === 'MEDIUM') return 'bg-amber-100 text-amber-600';
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen space-y-8 font-sans relative">
      <div className="flex justify-between items-center">
        <button 
          onClick={() => navigate('/care-target-group')}
          className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all border border-slate-200 shadow-sm"
        >
          <List size={16} /> 목록으로
        </button>

        <div className="flex gap-2 text-left">
          {(role === 'ADMIN' || role === 'MANAGER') && (
            <>
              <button 
                onClick={() => {
                  setSelectedIds([]);
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl font-bold text-sm shadow-md shadow-teal-100 hover:bg-teal-700 transition-all"
              >
                <UserPlus size={16} /> 대상자 추가
              </button>
              <button 
                onClick={handleOpenEditModal}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all"
              >
                <Edit3 size={16} /> 수정하기
              </button>
              <button 
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-red-100 text-red-500 rounded-xl font-bold text-sm shadow-sm hover:bg-red-50 transition-all"
              >
                <Trash2 size={16} /> 삭제하기
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm border-l-8 border-l-teal-500 text-left">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">{formData.groupName}</h1>
        <p className="text-lg text-slate-500 font-medium leading-relaxed">{formData.groupDescription}</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-left">
        <div className="flex items-center gap-2 mb-8">
          <ClipboardList className="text-teal-600" size={22} />
          <h2 className="text-xl font-bold text-slate-800">그룹 상세 정보</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-10 gap-x-12">
          {[
            { label: "시나리오명", value: formData.scenarioName },
            { label: "시나리오 설명", value: formData.scenarioDescription },
            { label: "전체 환자수", value: `${formData.careTargetCount || 0}명` },
            { label: "스케줄 상태", value: formData.groupStatus ? "활성" : "비활성", highlight: formData.groupStatus },
            { label: "생성일", value: formData.createDate },
            { label: "그룹 생성자", value: formData.createdByName },
          ].map((item, idx) => (
            <div key={idx} className="space-y-1">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
              <p className={`text-base font-bold ${item.highlight ? 'text-teal-600' : 'text-slate-700'}`}>
                {item.value || '-'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        {[
          { label: "일반", level: "LOW", count: formData.low, color: "text-slate-400" },
          { label: "주의", level: "MEDIUM", count: formData.medium, color: "text-amber-500" },
          { label: "위험", level: "HIGH", count: formData.high, color: "text-orange-500" },
          { label: "긴급", level: "CRITICAL", count: formData.critical, color: "text-red-500" }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm flex justify-between items-end transition-transform hover:scale-[1.02]">
            <div>
              <p className="text-sm font-black text-slate-500 mb-1">{stat.label} 환자</p>
              <p className="text-[10px] font-black text-slate-300 tracking-[0.2em]">{stat.level}</p>
            </div>
            <p className={`text-4xl font-black ${stat.color}`}>{stat.count}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[500px] overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0">
          <div className="flex items-center gap-2">
            <Users className="text-slate-400" size={20} />
            <h2 className="text-lg font-bold text-slate-800">대상자 목록</h2>
          </div>
          <span className="text-xs font-bold text-slate-400">Total: {formData.careList?.length || 0}</span>
        </div>
        <div className="overflow-y-auto flex-1 custom-scrollbar text-left">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
              <tr className="text-slate-400 text-[11px] font-black uppercase tracking-wider">
                <th className="px-8 py-4">성명</th>
                <th className="px-8 py-4">성별/나이</th>
                <th className="px-8 py-4">연락처</th>
                <th className="px-8 py-4 text-center">위험도</th>
                <th className="px-8 py-4 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {formData.careList?.map((p) => (
                <tr key={p.careTargetId} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-800 group-hover:text-teal-600 transition-colors">{p.name}</div>
                  </td>
                  <td className="px-8 py-5 text-sm font-bold text-slate-600">
                    {p.gender} <span className="mx-1 text-slate-200">|</span> {p.age}세
                  </td>
                  <td className="px-8 py-5 font-bold text-slate-600">{p.careTargetPhone || '미등록'}</td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-tighter ${getLevelColor(p.riskLevel)}`}>
                      {p.riskLevel || 'NORMAL'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => navigate(`/care-target/detail/${p.careTargetId}`)}
                      className="bg-slate-100 text-slate-600 hover:bg-teal-600 hover:text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                    >
                      상세보기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CareGroupCallSchedule 
        organizationId={organizationId} 
        groupId={groupId} 
      />

      <CareGroupEditModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editData={editData}
        setEditData={setEditData}
        careList={formData?.careList}
        scenarios={scenarios}
        onSave={handleUpdateSubmit} 
      />

      <CareGroupAddMemberModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        onSave={() => handleAddMemberSubmit(selectedIds)} 
        existingMemberIds={formData?.careList?.map(m => m.careTargetId) || []}
      />
    </div>
  );
};

export default CareTargetGroupDetailPage;