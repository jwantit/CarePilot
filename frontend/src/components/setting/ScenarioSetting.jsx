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
        <h1 className="text-3xl font-bold">시나리오 설정</h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 font-semibold"
        >
          시나리오 등록
        </button>
      </div>

      {/* 필터 섹션 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상태
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="전체">전체</option>
              <option value="활성">활성</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              위험 단계
            </label>
            <select
              value={filters.riskLevel}
              onChange={(e) => handleFilterChange("riskLevel", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="전체">전체</option>
              <option value="LOW">낮음</option>
              <option value="MEDIUM">보통</option>
              <option value="HIGH">높음</option>
              <option value="CRITICAL">긴급</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
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
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  시나리오명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  설명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  위험 레벨
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사용 여부
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scenarios.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    등록된 시나리오가 없습니다.
                  </td>
                </tr>
              ) : (
                scenarios.map((scenario) => (
                  <tr key={scenario.scenarioId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {scenario.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                      {scenario.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getRiskLevelLabel(scenario.riskLevel)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8">
            <h2 className="text-2xl font-bold mb-4">
              {editingScenario ? "시나리오 수정" : "시나리오 등록"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  시나리오명
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    카테고리
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    위험 레벨
                  </label>
                  <select
                    value={formData.riskLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, riskLevel: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="LOW">낮음</option>
                    <option value="MEDIUM">보통</option>
                    <option value="HIGH">높음</option>
                    <option value="CRITICAL">긴급</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  위험 기준
                </label>
                <textarea
                  value={formData.riskCriteria}
                  onChange={(e) =>
                    setFormData({ ...formData, riskCriteria: e.target.value })
                  }
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* 질문 리스트 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    질문 리스트
                  </label>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="px-3 py-1 text-sm bg-teal-500 text-white rounded-md hover:bg-teal-600"
                  >
                    질문 추가
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {formData.questions.map((question, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-2 p-2 border border-gray-200 rounded-md"
                    >
                      <div className="flex-1">
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
                          placeholder="질문 내용"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 mb-2"
                        />
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={question.questionOrder}
                            onChange={(e) =>
                              updateQuestion(
                                index,
                                "questionOrder",
                                parseInt(e.target.value),
                              )
                            }
                            placeholder="순서"
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                          <label className="flex items-center text-sm text-gray-700">
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
                              className="mr-1"
                            />
                            필수
                          </label>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="px-2 py-1 text-sm text-red-600 hover:text-red-800"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:opacity-50"
                >
                  {loading ? "저장 중..." : "저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      {showDetailModal && selectedScenario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">시나리오 상세</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  시나리오명
                </label>
                <p className="text-base text-gray-900">
                  {selectedScenario.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <p className="text-base text-gray-900">
                  {selectedScenario.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    카테고리
                  </label>
                  <p className="text-base text-gray-900">
                    {selectedScenario.category || "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    위험 레벨
                  </label>
                  <p className="text-base text-gray-900">
                    {getRiskLevelLabel(selectedScenario.riskLevel)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  위험 기준
                </label>
                <p className="text-base text-gray-900">
                  {selectedScenario.riskCriteria || "-"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  질문 리스트
                </label>
                {selectedScenario.questions &&
                selectedScenario.questions.length > 0 ? (
                  <div className="space-y-2">
                    {selectedScenario.questions.map((question, index) => (
                      <div
                        key={question.questionId || index}
                        className="p-3 border border-gray-200 rounded-md"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">
                              {index + 1}. {question.questionText}
                            </p>
                            <div className="mt-1 text-xs text-gray-500">
                              순서: {question.questionOrder} |{" "}
                              {question.isRequired ? "필수" : "선택"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    등록된 질문이 없습니다.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleCloseDetailModal}
                className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScenarioSetting;
