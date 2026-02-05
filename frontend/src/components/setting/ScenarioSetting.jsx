import { useState, useEffect } from "react";
import {
  getScenariosByFilter,
  createScenario,
  updateScenario,
  deleteScenario,
  getScenarioById,
} from "../../api/scenarioApi";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { getRiskLevelLabel } from "../../utils/riskLevelStyles";
import { 
  X, 
  PlusCircle, 
  FileText, 
  ClipboardList, 
  ShieldCheck, 
  HelpCircle,
  Trash2,
  Plus
} from "lucide-react";

const inputClass =
  "w-full p-2.5 border border-slate-600 rounded-sm bg-gradient-to-br from-slate-900 to-slate-950 text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all";
const labelClass = "block text-sm font-semibold text-slate-200 mb-1.5";
const selectClass =
  "w-full p-2.5 border border-slate-600 rounded-sm bg-gradient-to-br from-slate-900 to-slate-950 text-slate-200 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none cursor-pointer transition-all";

function ScenarioSetting() {
  const auth = useSelector((state) => state.auth);
  const organizationId = auth.user?.organizationId;
  const currentUserId = auth.user?.userId;

  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "전체",
    riskLevel: "전체",
    category: "전체",
  });
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    riskLevel: "MEDIUM",
    enabled: false,
    riskCriteria: "",
    questions: [],
  });

  useEffect(() => {
    loadScenarios();
  }, [filters]);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      const data = await getScenariosByFilter(
        organizationId,
        filters.status,
        filters.riskLevel,
        filters.category,
      );
      setScenarios(data);
    } catch (error) {
      console.error("시나리오 목록 조회 실패:", error);
      toast.error("시나리오 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOpenModal = async (scenario = null) => {
    if (scenario) {
      try {
        // 수정 시 전체 데이터를 다시 불러와서 질문 리스트 포함
        const fullScenario = await getScenarioById(scenario.scenarioId);
        setEditingScenario(fullScenario);
        setFormData({
          name: fullScenario.name || "",
          description: fullScenario.description || "",
          category: fullScenario.category || "",
          riskLevel: fullScenario.riskLevel || "MEDIUM",
          enabled:
            fullScenario.enabled !== undefined ? fullScenario.enabled : false,
          riskCriteria: fullScenario.riskCriteria || "",
          questions: fullScenario.questions || [],
        });
      } catch (error) {
        console.error("시나리오 상세 조회 실패:", error);
        toast.error("시나리오 정보를 불러오는데 실패했습니다.");
        return;
      }
    } else {
      setEditingScenario(null);
      setFormData({
        name: "",
        description: "",
        category: "",
        riskLevel: "MEDIUM",
        enabled: true, // 새로 등록할 때는 기본적으로 활성
        riskCriteria: "",
        questions: [],
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingScenario(null);
    setFormData({
      name: "",
      description: "",
      category: "",
      riskLevel: "MEDIUM",
      enabled: false,
      riskCriteria: "",
      questions: [],
    });
  };

  const handleOpenDetailModal = async (scenarioId) => {
    try {
      const scenario = await getScenarioById(scenarioId);
      setSelectedScenario(scenario);
      setShowDetailModal(true);
    } catch (error) {
      console.error("시나리오 상세 조회 실패:", error);
      toast.error("시나리오 상세 정보를 불러오는데 실패했습니다.");
    }
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedScenario(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const scenarioData = {
        ...formData,
        createdBy: currentUserId,
      };

      if (editingScenario) {
        await updateScenario(editingScenario.scenarioId, scenarioData);
        toast.success("시나리오가 수정되었습니다.");
      } else {
        await createScenario(organizationId, scenarioData);
        toast.success("시나리오가 등록되었습니다.");
      }
      handleCloseModal();
      loadScenarios();
    } catch (error) {
      console.error("시나리오 저장 실패:", error);
      toast.error(
        editingScenario
          ? "시나리오 수정에 실패했습니다."
          : "시나리오 등록에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (scenarioId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) {
      return;
    }

    try {
      setLoading(true);
      await deleteScenario(scenarioId);
      toast.success("시나리오가 삭제되었습니다.");
      loadScenarios();
    } catch (error) {
      console.error("시나리오 삭제 실패:", error);
      toast.error("시나리오 삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };


  const handleToggleEnabled = async (scenarioId, newEnabledStatus) => {
    try {
      setLoading(true);
      // 1. 현재 시나리오 데이터를 가져옵니다. (updateScenario가 전체 DTO를 요구하므로)
      const currentScenario = await getScenarioById(scenarioId);

      // 2. enabled 상태만 업데이트하고 나머지 데이터는 유지합니다.
      const updatedScenarioData = {
        ...currentScenario,
        enabled: newEnabledStatus,
      };

      // 3. updateScenario 함수를 호출합니다.
      await updateScenario(scenarioId, updatedScenarioData);
      toast.success(
        `시나리오가 ${newEnabledStatus ? "활성화" : "비활성화"}되었습니다.`,
      );
      loadScenarios(); // 목록 새로고침
    } catch (error) {
      console.error("시나리오 상태 업데이트 실패:", error);
      toast.error("시나리오 상태 업데이트에 실패했습니다.");
    } finally {
      setLoading(false); // Ensure loading state is reset even on error
    }
  };

  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionText: "",
          questionOrder: prev.questions.length + 1,
          isRequired: false,
        },
      ],
    }));
  };

  const removeQuestion = (index) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions
        .filter((_, i) => i !== index)
        .map((q, i) => ({
          ...q,
          questionOrder: i + 1,
        })),
    }));
  };

  const updateQuestion = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q,
      ),
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">시나리오 설정</h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-gradient-to-br from-slate-900 to-slate-950 border border-teal-500/50 text-teal-400 rounded-sm hover:from-slate-800 hover:to-slate-900 hover:border-teal-500 font-semibold shadow-md"
        >
          시나리오 등록
        </button>
      </div>

      {/* 필터 섹션 */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-none shadow-lg p-4 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">
              상태
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="h-9 px-3 w-full border border-slate-700 rounded-none bg-slate-900 text-slate-200 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none cursor-pointer"
            >
              <option value="전체">전체</option>
              <option value="활성">활성</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">
              위험 단계
            </label>
            <select
              value={filters.riskLevel}
              onChange={(e) => handleFilterChange("riskLevel", e.target.value)}
              className="h-9 px-3 w-full border border-slate-700 rounded-none bg-slate-900 text-slate-200 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none cursor-pointer"
            >
              <option value="전체">전체</option>
              <option value="LOW">낮음</option>
              <option value="MEDIUM">보통</option>
              <option value="HIGH">높음</option>
              <option value="CRITICAL">긴급</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">
              카테고리
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="h-9 px-3 w-full border border-slate-700 rounded-none bg-slate-900 text-slate-200 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none cursor-pointer"
            >
              <option value="전체">전체</option>
              <option value="정기 모니터링">정기 모니터링</option>
              <option value="긴급 상황">긴급 상황</option>
              <option value="질병별 모니터링">질병별 모니터링</option>
            </select>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-slate-800 border border-slate-700 rounded-none overflow-hidden shadow-lg">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-slate-500">로딩 중...</div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  시나리오명
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  설명
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  위험 레벨
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  사용 여부
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {scenarios.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-slate-500"
                  >
                    등록된 시나리오가 없습니다.
                  </td>
                </tr>
              ) : (
                scenarios.map((scenario) => (
                  <tr key={scenario.scenarioId} className="hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-100">
                      {scenario.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300 max-w-md truncate">
                      {scenario.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {getRiskLevelLabel(scenario.riskLevel)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={scenario.enabled}
                          onChange={(e) =>
                            handleToggleEnabled(
                              scenario.scenarioId,
                              e.target.checked,
                            )
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-slate-700 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-200 after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                      </label>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button
                        onClick={() =>
                          handleOpenDetailModal(scenario.scenarioId)
                        }
                        className="cp-link-slate"
                      >
                        상세
                      </button>
                      <button
                        onClick={() => handleOpenModal(scenario)}
                        className="cp-link-blue"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(scenario.scenarioId)}
                        className="cp-link-red"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 등록/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-sm shadow-xl w-full max-w-2xl overflow-hidden">
            {/* 헤더 */}
            <div className="flex justify-between items-center p-5 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 shrink-0">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                {editingScenario ? (
                  <FileText size={24} className="text-teal-400" />
                ) : (
                  <PlusCircle size={24} className="text-teal-400" />
                )}
                {editingScenario ? "시나리오 정보 수정" : "신규 시나리오 등록"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-sm text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh] modal-scrollbar">
              <div className="grid grid-cols-2 gap-5">
                {/* 섹션 1: 시나리오 기본 정보 */}
                <div className="col-span-2 flex items-center gap-2 mb-1 pb-1 border-b border-slate-700 text-teal-400 font-bold text-sm">
                  <ClipboardList size={16} /> 시나리오 기본 정보
                </div>

                <div className="col-span-2">
                  <label className={labelClass}>시나리오명</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="시나리오 이름을 입력하세요"
                    className={inputClass}
                  />
                </div>

                <div className="col-span-2">
                  <label className={labelClass}>설명</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows="2"
                    placeholder="시나리오에 대한 간단한 설명을 입력하세요"
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div>
                  <label className={labelClass}>카테고리</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="예: 정기 모니터링"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>위험 레벨</label>
                  <select
                    value={formData.riskLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, riskLevel: e.target.value })
                    }
                    required
                    className={selectClass}
                  >
                    <option value="LOW" className="bg-slate-900">낮음</option>
                    <option value="MEDIUM" className="bg-slate-900">보통</option>
                    <option value="HIGH" className="bg-slate-900">높음</option>
                    <option value="CRITICAL" className="bg-slate-900">긴급</option>
                  </select>
                </div>

                {/* 섹션 2: 위험 기준 정보 */}
                <div className="col-span-2 flex items-center gap-2 mt-4 mb-1 pb-1 border-b border-slate-700 text-teal-400 font-bold text-sm">
                  <ShieldCheck size={16} /> 위험 기준 설정
                </div>

                <div className="col-span-2">
                  <label className={labelClass}>위험 판정 기준</label>
                  <textarea
                    value={formData.riskCriteria}
                    onChange={(e) =>
                      setFormData({ ...formData, riskCriteria: e.target.value })
                    }
                    rows="2"
                    placeholder="위험으로 판정할 기준을 입력하세요"
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {/* 섹션 3: 질문 리스트 */}
                <div className="col-span-2 flex items-center justify-between mt-4 mb-1 pb-1 border-b border-slate-700 text-teal-400 font-bold text-sm">
                  <div className="flex items-center gap-2">
                    <HelpCircle size={16} /> 질문 구성
                  </div>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="flex items-center gap-1 px-2 py-0.5 text-xs bg-teal-500/10 border border-teal-500/50 text-teal-400 rounded-sm hover:bg-teal-500/20 transition-all"
                  >
                    <Plus size={14} /> 질문 추가
                  </button>
                </div>

                <div className="col-span-2 space-y-3">
                  {formData.questions.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-slate-700 rounded-sm bg-slate-900/50 text-slate-500 text-sm">
                      등록된 질문이 없습니다. 질문을 추가해주세요.
                    </div>
                  ) : (
                    formData.questions.map((question, index) => (
                      <div
                        key={index}
                        className="p-4 border border-slate-700 rounded-sm bg-slate-900/50 space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-teal-500/70 bg-teal-500/5 px-2 py-0.5 rounded-sm border border-teal-500/20">
                            질문 {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeQuestion(index)}
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        
                        <input
                          type="text"
                          value={question.questionText}
                          onChange={(e) =>
                            updateQuestion(
                              index,
                              "questionText",
                              e.target.value,
                            )
                          }
                          placeholder="질문 내용을 입력하세요"
                          className={inputClass}
                        />

                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-slate-400">정렬 순서</label>
                            <input
                              type="number"
                              value={question.questionOrder}
                              onChange={(e) =>
                                updateQuestion(
                                  index,
                                  "questionOrder",
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              className="w-16 p-1 text-xs border border-slate-600 rounded-sm bg-slate-900 text-slate-200 outline-none focus:border-teal-500"
                            />
                          </div>
                          
                          <label className="flex items-center gap-2 cursor-pointer group/label">
                            <div className="relative inline-flex items-center">
                              <input
                                type="checkbox"
                                checked={question.isRequired}
                                onChange={(e) =>
                                  updateQuestion(
                                    index,
                                    "isRequired",
                                    e.target.checked,
                                  )
                                }
                                className="sr-only peer"
                              />
                              <div className="w-8 h-4 bg-slate-700 rounded-full peer peer-checked:bg-teal-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"></div>
                            </div>
                            <span className="text-xs font-semibold text-slate-400 group-hover/label:text-slate-200 transition-colors">필수 답변</span>
                          </label>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-10">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-600 text-slate-300 rounded-sm font-semibold hover:from-slate-800 hover:to-slate-900 hover:border-slate-500 hover:text-slate-100 transition-all shadow-md"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-br from-teal-600 to-teal-700 border border-teal-500 text-white rounded-sm font-semibold hover:from-teal-500 hover:to-teal-600 disabled:from-slate-700 disabled:to-slate-800 disabled:border-slate-600 disabled:text-slate-400 transition-all shadow-md"
                >
                  {loading ? "저장 중..." : (editingScenario ? "저장 완료" : "시나리오 등록 완료")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      {showDetailModal && selectedScenario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-sm shadow-xl w-full max-w-2xl overflow-hidden">
            {/* 헤더 */}
            <div className="flex justify-between items-center p-5 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 shrink-0">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <FileText size={24} className="text-teal-400" />
                시나리오 상세 정보
              </h3>
              <button
                onClick={handleCloseDetailModal}
                className="p-1 rounded-sm text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[80vh] modal-scrollbar">
              <div className="grid grid-cols-2 gap-5">
                {/* 섹션 1: 시나리오 기본 정보 */}
                <div className="col-span-2 flex items-center gap-2 mb-1 pb-1 border-b border-slate-700 text-teal-400 font-bold text-sm">
                  <ClipboardList size={16} /> 시나리오 기본 정보
                </div>

                <div className="col-span-2">
                  <label className={labelClass}>시나리오명</label>
                  <p className="p-2.5 border border-slate-700/50 rounded-sm bg-slate-900/30 text-slate-100">
                    {selectedScenario.name}
                  </p>
                </div>

                <div className="col-span-2">
                  <label className={labelClass}>설명</label>
                  <p className="p-2.5 border border-slate-700/50 rounded-sm bg-slate-900/30 text-slate-300 min-h-[3rem]">
                    {selectedScenario.description || "설명이 없습니다."}
                  </p>
                </div>

                <div>
                  <label className={labelClass}>카테고리</label>
                  <p className="p-2.5 border border-slate-700/50 rounded-sm bg-slate-900/30 text-slate-300">
                    {selectedScenario.category || "-"}
                  </p>
                </div>

                <div>
                  <label className={labelClass}>위험 레벨</label>
                  <div className="p-2.5 border border-slate-700/50 rounded-sm bg-slate-900/30">
                    <span className="text-slate-300">
                      {getRiskLevelLabel(selectedScenario.riskLevel)}
                    </span>
                  </div>
                </div>

                {/* 섹션 2: 위험 기준 정보 */}
                <div className="col-span-2 flex items-center gap-2 mt-4 mb-1 pb-1 border-b border-slate-700 text-teal-400 font-bold text-sm">
                  <ShieldCheck size={16} /> 위험 기준 설정
                </div>

                <div className="col-span-2">
                  <label className={labelClass}>위험 판정 기준</label>
                  <p className="p-2.5 border border-slate-700/50 rounded-sm bg-slate-900/30 text-slate-300 min-h-[3rem]">
                    {selectedScenario.riskCriteria || "-"}
                  </p>
                </div>

                {/* 섹션 3: 질문 리스트 */}
                <div className="col-span-2 flex items-center gap-2 mt-4 mb-1 pb-1 border-b border-slate-700 text-teal-400 font-bold text-sm">
                  <HelpCircle size={16} /> 질문 리스트
                </div>

                <div className="col-span-2 space-y-3">
                  {selectedScenario.questions && selectedScenario.questions.length > 0 ? (
                    selectedScenario.questions.map((question, index) => (
                      <div
                        key={question.questionId || index}
                        className="p-4 border border-slate-700 rounded-sm bg-slate-900/30 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-teal-500/70 bg-teal-500/5 px-2 py-0.5 rounded-sm border border-teal-500/20">
                            질문 {index + 1}
                          </span>
                          {question.isRequired && (
                            <span className="text-[10px] font-bold text-amber-500/70 bg-amber-500/5 px-1.5 py-0.5 rounded-sm border border-amber-500/20">
                              필수 답변
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-100 leading-relaxed">
                          {question.questionText}
                        </p>
                        <div className="text-[10px] text-slate-500 font-medium">
                          정렬 순서: {question.questionOrder}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 border border-dashed border-slate-700 rounded-sm bg-slate-900/50 text-slate-500 text-sm">
                      등록된 질문이 없습니다.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-10">
                <button
                  onClick={handleCloseDetailModal}
                  className="px-8 py-3 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-600 text-slate-300 rounded-sm font-semibold hover:from-slate-800 hover:to-slate-900 hover:border-slate-500 hover:text-slate-100 transition-all shadow-md"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScenarioSetting;
