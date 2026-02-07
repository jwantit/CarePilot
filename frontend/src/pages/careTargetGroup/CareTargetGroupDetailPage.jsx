import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Users,
  Phone,
  Calendar,
  ClipboardList,
  User,
  Edit3,
  Trash2,
  ChevronLeft,
  UserPlus,
  Activity,
  Loader2,
  Shield,
  AlertTriangle,
  Clock,
} from "lucide-react";
import {
  getCareGroupDetail,
  deleteCareGroup,
  updateCareGroup,
  addCareTargetGroup,
  getScenarioList,
} from "../../api/caretarget/careTargetGroupApi";
import { useAuth } from "../../hooks/useAuth";
import Breadcrumb from "../../components/common/Breadcrumb";
import { getRiskLevelLabel, getRiskLevelStyle } from "../../utils/riskLevelStyles";
import StatCardGrid from "../../components/common/StatCardGrid";
import CareGroupEditModal from "../../components/careTargetGroup/careTargetGroupDetail/CareGroupEditModal";
import CareGroupAddMemberModal from "../../components/careTargetGroup/careTargetGroupDetail/CareGroupAddMemberModal";
import CareGroupCallSchedule from "../../components/careTargetGroup/careTargetGroupDetail/CareGroupCallSchedule";

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
    careGroupId: "",
    groupName: "",
    groupDescription: "",
    groupStatus: true,
    scenarioId: null,
    careTargetIds: [], // 제외할 ID들이 담기는 배열
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
      setScenarios(
        Array.isArray(scenarioRes) ? scenarioRes : scenarioRes.data || [],
      );
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
        careTargetIds: excludedIds,
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
        careTargetIds: newAddedIds,
      };

      const result = await addCareTargetGroup(requestData);
      setFormData(result);

      alert(`신규 멤버 ${newAddedIds.length}명이 추가되었습니다.`);
      setIsAddModalOpen(false);
      setSelectedIds([]);
    } catch (error) {
      console.error("멤버 추가 실패:", error);
      alert(
        error.response?.data?.message || "멤버 추가 중 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        "정말 이 그룹을 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.",
      )
    ) {
      try {
        setLoading(true);
        await deleteCareGroup(groupId);
        alert("그룹이 삭제되었습니다.");
        navigate("/care-target-group");
      } catch (error) {
        console.error("삭제 실패:", error);
        alert("삭제 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
  };

  // 통계 카드 데이터 준비 (early return 전에 호출되어야 함)
  const statCards = useMemo(
    () => [
      {
        value: formData?.low || 0,
        label: "일반 대상자",
        icon: Shield,
        iconColor: "text-emerald-400",
        valueColor: "text-emerald-400",
        hoverBorderColor: "hover:border-emerald-500/50",
      },
      {
        value: formData?.medium || 0,
        label: "주의 대상자",
        icon: AlertTriangle,
        iconColor: "text-yellow-400",
        valueColor: "text-yellow-400",
        hoverBorderColor: "hover:border-yellow-500/50",
      },
      {
        value: formData?.high || 0,
        label: "위험 대상자",
        icon: AlertTriangle,
        iconColor: "text-orange-400",
        valueColor: "text-orange-400",
        hoverBorderColor: "hover:border-orange-500/50",
      },
      {
        value: formData?.critical || 0,
        label: "긴급 대상자",
        icon: AlertTriangle,
        iconColor: "text-red-400",
        valueColor: "text-red-400",
        hoverBorderColor: "hover:border-red-500/50",
      },
    ],
    [formData?.low, formData?.medium, formData?.high, formData?.critical],
  );

  if (loading && !formData) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-4">
        <div className="w-12 h-12 border-4 border-cp-border border-t-teal-400 rounded-full animate-spin" />
        <p className="text-cp-muted text-sm font-mono">로딩 중...</p>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-cp-card border border-cp-border shadow-xl rounded-sm">
        <div className="w-20 h-20 bg-cp-bg border-2 border-cp-border rounded flex items-center justify-center mb-5">
          <span className="text-3xl text-cp-muted">[ ]</span>
        </div>
        <p className="text-cp-text font-mono font-semibold text-base mb-2">
          // No group data found
        </p>
        <p className="text-cp-muted text-sm font-mono">
          // 그룹 정보를 찾을 수 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={["케어 그룹", formData?.groupName ?? "상세"]} />
      <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border px-5 py-3 mb-6 shadow-lg hover:shadow-xl transition-shadow rounded-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/care-target-group")}
            className="flex items-center gap-2 bg-cp-input hover:bg-cp-bg text-teal-400 px-5 py-2.5 text-sm font-semibold transition-all border border-teal-500/50 hover:border-teal-500 shadow-md hover:shadow-lg hover:-translate-y-0.5 rounded-sm"
          >
            <ChevronLeft size={18} />
            목록으로
          </button>

          {(role === "ADMIN" || role === "MANAGER") && (
            <>
              <button
                onClick={() => {
                  setSelectedIds([]);
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-2 bg-cp-input hover:bg-cp-bg text-teal-400 px-5 py-2.5 text-sm font-semibold transition-all border border-teal-500/50 hover:border-teal-500 shadow-md hover:shadow-lg hover:-translate-y-0.5 rounded-sm"
              >
                <UserPlus size={18} />
                대상자 추가
              </button>
              <button
                onClick={handleOpenEditModal}
                className="flex items-center gap-2 bg-cp-input hover:bg-cp-bg text-orange-400 px-5 py-2.5 text-sm font-semibold transition-all border border-orange-500/50 hover:border-orange-500 shadow-md hover:shadow-lg hover:-translate-y-0.5 rounded-sm"
              >
                <Edit3 size={18} />
                수정하기
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 bg-cp-input hover:bg-cp-bg text-red-400 px-5 py-2.5 text-sm font-semibold transition-all border border-red-500/50 hover:border-red-500 shadow-md hover:shadow-lg hover:-translate-y-0.5 rounded-sm"
              >
                <Trash2 size={18} />
                삭제하기
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border p-8 mb-6 shadow-lg hover:shadow-xl transition-shadow rounded-sm">
        {/* 그룹 제목 및 설명 */}
        <div className="mb-8 pb-6 border-b border-cp-border/50">
          <h1 className="text-3xl font-black text-cp-text tracking-tight mb-3">
            {formData.groupName}
          </h1>
          <p className="text-base text-cp-muted font-medium leading-relaxed">
            {formData.groupDescription}
          </p>
        </div>

        {/* 그룹 상세 정보 */}
        <div className="space-y-6">
          {/* 시나리오 정보 - 전체 너비 사용 */}
          <div className="space-y-4 pb-6 border-b border-cp-border/50">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-cp-muted uppercase tracking-widest">
                시나리오명
              </p>
              <p className="text-base font-bold text-cp-text break-words">
                {formData.scenarioName || "-"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-cp-muted uppercase tracking-widest">
                시나리오 설명
              </p>
              <p className="text-base font-bold text-cp-text break-words leading-relaxed">
                {formData.scenarioDescription || "-"}
              </p>
            </div>
          </div>

          {/* 기타 정보 - 한 줄 레이아웃 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                label: "소속된 대상자",
                value: `${formData.careTargetCount || 0}명`,
              },
              {
                label: "스케줄 상태",
                value: formData.groupStatus ? "활성" : "비활성",
                highlight: formData.groupStatus,
              },
              { label: "생성일", value: formData.createDate },
              { label: "그룹 생성자", value: formData.createdByName },
            ].map((item, idx) => (
              <div key={idx} className="space-y-1">
                <p className="text-[10px] font-black text-cp-muted uppercase tracking-widest">
                  {item.label}
                </p>
                <p
                  className={`text-base font-bold ${item.highlight ? "text-teal-400" : "text-cp-text"}`}
                >
                  {item.value || "-"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <StatCardGrid cards={statCards} />

      <div className="bg-cp-card border border-cp-border shadow-lg hover:shadow-xl transition-shadow flex flex-col h-[500px] overflow-hidden rounded-sm mb-6">
        <div className="p-6 border-b border-cp-border flex justify-between items-center bg-cp-bg/30 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-sm bg-gradient-to-br from-teal-500/20 to-teal-600/20 text-teal-400 border border-teal-500/50 shadow-sm">
              <Users size={18} />
            </div>
            <h2 className="text-lg font-bold text-cp-text">대상자 목록</h2>
          </div>
          <span className="text-xs font-bold text-cp-muted">
            <span className="font-mono">
              Total: [{formData.careList?.length || 0}]
            </span>
          </span>
        </div>
        <div className="overflow-y-auto flex-1 modal-scrollbar">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 bg-cp-header border-b-2 border-teal-500/30 z-10">
              <tr className="text-xs font-semibold text-white dark:text-cp-muted">
                <th className="px-8 py-3.5">
                  <div className="flex items-center gap-1 text-white dark:text-teal-400">
                    <span>성명</span>
                  </div>
                </th>
                <th className="px-8 py-3.5">
                  <div className="flex items-center gap-1 text-white dark:text-teal-400">
                    <span>성별/나이</span>
                  </div>
                </th>
                <th className="px-8 py-3.5">
                  <div className="flex items-center gap-1 text-white dark:text-teal-400">
                    <span>연락처</span>
                  </div>
                </th>
                <th className="px-8 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-white dark:text-teal-400">
                    <span>위험도</span>
                  </div>
                </th>
                <th className="px-8 py-3.5 text-right text-white dark:text-teal-400">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cp-border">
              {formData.careList?.map((p) => (
                <tr
                  key={p.careTargetId}
                  onClick={() => navigate(`/care-target/detail/${p.careTargetId}`)}
                  className="hover:bg-cp-bg/50 transition-colors group bg-cp-card/50 cursor-pointer"
                >
                  <td className="px-8 py-5">
                    <div className="font-bold text-cp-text group-hover:text-teal-400 transition-colors">
                      {p.name}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-bold text-cp-text">
                    {p.gender} <span className="mx-1 text-cp-muted">|</span>{" "}
                    {p.age}세
                  </td>
                  <td className="px-8 py-5 font-bold text-cp-text">
                    {p.careTargetPhone || "미등록"}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span
                      className={`px-3 py-1 rounded-sm text-[10px] font-black tracking-tighter border ${getRiskLevelStyle(p.riskLevel)} shadow-sm`}
                    >
                      {getRiskLevelLabel(p.riskLevel) || "보통"}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/care-target/detail/${p.careTargetId}`);
                      }}
                      className="px-3 py-1 bg-cp-input hover:bg-cp-bg text-teal-400 text-xs font-semibold transition-all border border-teal-500/50 hover:border-teal-500 flex items-center gap-1 shadow-md hover:shadow-lg hover:-translate-y-0.5 rounded-sm"
                    >
                      <span className="font-mono text-teal-400">&gt;</span>
                      <span>상세보기</span>
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
        existingMemberIds={formData?.careList?.map((m) => m.careTargetId) || []}
      />
    </div>
  );
};

export default CareTargetGroupDetailPage;
