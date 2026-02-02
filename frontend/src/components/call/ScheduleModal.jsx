import React, { useState, useEffect, useCallback, useRef } from "react";
import { createSchedule, updateSchedule } from "../../api/callApi";
import { getCareTargetAllList } from "../../api/caretarget/careTargetApi";
import { getScenarioList } from "../../api/caretarget/careTargetGroupApi";

const DEBOUNCE_MS = 300;

const ScheduleModal = ({ isOpen, onClose, onSaveSuccess, organizationId, editingSchedule }) => {
  const orgId = organizationId ?? null;

  const [formData, setFormData] = useState({
    organizationId: orgId,
    careTargetId: "",
    scenarioId: null,
    scheduledTime: "",
    type: "ONE_TIME",
    priority: "MEDIUM",
    memo: "",
    recurrence: "",
    recurrenceEndDate: "",
  });

  const [careTargetSearch, setCareTargetSearch] = useState("");
  const [careTargetList, setCareTargetList] = useState([]);
  const [showCareTargetDropdown, setShowCareTargetDropdown] = useState(false);
  const [selectedCareTargetDisplay, setSelectedCareTargetDisplay] = useState(""); // "홍길동 (123)"
  const [scenarios, setScenarios] = useState([]);
  const [loadingCareTargets, setLoadingCareTargets] = useState(false);
  const debounceRef = useRef(null);
  const dropdownRef = useRef(null);

  const fetchCareTargets = useCallback(
    async (keyword) => {
      if (!orgId) return;
      setLoadingCareTargets(true);
      try {
        const data = await getCareTargetAllList(orgId, keyword || "");
        setCareTargetList(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("케어대상 목록 조회 실패:", e);
        setCareTargetList([]);
      } finally {
        setLoadingCareTargets(false);
      }
    },
    [orgId]
  );

  const fetchScenarios = useCallback(async () => {
    if (!orgId) return;
    try {
      const data = await getScenarioList(orgId);
      setScenarios(Array.isArray(data) ? data : data?.data || []);
    } catch (e) {
      console.error("시나리오 목록 조회 실패:", e);
      setScenarios([]);
    }
  }, [orgId]);

  useEffect(() => {
    if (!isOpen) return;
    fetchScenarios();
    setCareTargetSearch("");
    setCareTargetList([]);
    setShowCareTargetDropdown(false);
    if (!editingSchedule) {
      setSelectedCareTargetDisplay("");
      fetchCareTargets("");
    }
  }, [isOpen, editingSchedule, fetchScenarios, fetchCareTargets]);

  useEffect(() => {
    if (!isOpen) return;
    if (editingSchedule) {
      const name = editingSchedule.careTargetName || "대상자";
      const id = editingSchedule.careTargetId;
      setSelectedCareTargetDisplay(id != null ? `${name} (${id})` : name);
      setCareTargetSearch("");
    }
  }, [isOpen, editingSchedule]);

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (showCareTargetDropdown || !selectedCareTargetDisplay) {
        fetchCareTargets(careTargetSearch);
      }
      debounceRef.current = null;
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [careTargetSearch, isOpen, showCareTargetDropdown, selectedCareTargetDisplay, fetchCareTargets]);

  useEffect(() => {
    if (!isOpen || !editingSchedule) return;
    const scheduledTimeStr = editingSchedule.scheduledTime
      ? editingSchedule.scheduledTime.replace(" ", "T").slice(0, 16)
      : "";
    const recurrenceEndDateStr = editingSchedule.recurrenceEndDate
      ? editingSchedule.recurrenceEndDate.replace(" ", "T").slice(0, 16)
      : "";
    setFormData({
      organizationId: orgId,
      careTargetId: editingSchedule.careTargetId ?? "",
      scenarioId: editingSchedule.scenarioId ?? null,
      scheduledTime: scheduledTimeStr,
      type: editingSchedule.type || "ONE_TIME",
      priority: editingSchedule.priority || "MEDIUM",
      memo: editingSchedule.memo || "",
      recurrence: editingSchedule.recurrence || "",
      recurrenceEndDate: recurrenceEndDateStr,
    });
  }, [isOpen, editingSchedule, orgId]);

  useEffect(() => {
    if (!isOpen || editingSchedule) return;
    setFormData({
      organizationId: orgId,
      careTargetId: "",
      scenarioId: null,
      scheduledTime: "",
      type: "ONE_TIME",
      priority: "MEDIUM",
      memo: "",
      recurrence: "",
      recurrenceEndDate: "",
    });
  }, [isOpen, editingSchedule, orgId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowCareTargetDropdown(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "type" && value !== "RECURRING") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        recurrence: "",
        recurrenceEndDate: "",
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCareTargetSelect = (item) => {
    setFormData((prev) => ({ ...prev, careTargetId: item.careTargetId }));
    setSelectedCareTargetDisplay(`${item.name} (${item.careTargetId})`);
    setCareTargetSearch("");
    setShowCareTargetDropdown(false);
  };

  const handleCareTargetInputFocus = () => {
    setShowCareTargetDropdown(true);
    if (!careTargetList.length && !loadingCareTargets) fetchCareTargets(careTargetSearch);
  };

  const handleCareTargetInputChange = (e) => {
    const v = e.target.value;
    setCareTargetSearch(v);
    setShowCareTargetDropdown(true);
    if (!v) {
      setFormData((prev) => ({ ...prev, careTargetId: "" }));
      setSelectedCareTargetDisplay("");
    } else {
      setSelectedCareTargetDisplay("");
      setFormData((prev) => ({ ...prev, careTargetId: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orgId) {
      alert("업체 정보가 없습니다. 로그인 상태를 확인해주세요.");
      return;
    }
    if (!formData.careTargetId) {
      alert("전화할 케어대상을 선택해주세요.");
      return;
    }
    try {
      const payload = {
        careTargetId: formData.careTargetId,
        scenarioId: formData.scenarioId || null,
        scheduledTime: formData.scheduledTime,
        type: formData.type,
        priority: formData.priority,
        recurrence: formData.type === "RECURRING" ? formData.recurrence || null : null,
        recurrenceEndDate:
          formData.type === "RECURRING" && formData.recurrenceEndDate
            ? formData.recurrenceEndDate
            : null,
        memo: formData.memo,
      };

      if (editingSchedule) {
        await updateSchedule(editingSchedule.scheduleId, payload);
        alert("일정이 성공적으로 수정되었습니다.");
      } else {
        await createSchedule({ ...payload, organizationId: formData.organizationId });
        alert("일정이 성공적으로 등록되었습니다.");
      }
      onSaveSuccess();
      onClose();
    } catch (error) {
      console.error(editingSchedule ? "일정 수정 실패:" : "일정 등록 실패:", error);
      alert(editingSchedule ? "수정 중 오류가 발생했습니다." : "등록 중 오류가 발생했습니다.");
    }
  };

  if (!isOpen) return null;

  const displayValue = selectedCareTargetDisplay || careTargetSearch;
  const filteredList = careTargetList.filter((item) => {
    const name = (item.name || "").toLowerCase();
    const keyword = (careTargetSearch || "").toLowerCase();
    return !keyword || name.startsWith(keyword) || name.includes(keyword);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center sticky top-0 z-10">
          <h3 className="text-lg font-bold">
            {editingSchedule ? "통화 일정 수정" : "새 통화 일정 등록"}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-black text-2xl">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!orgId && (
            <p className="text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-4 text-sm">
              업체 정보가 없습니다. 로그인 상태를 확인해주세요.
            </p>
          )}
          {/* 케어대상 검색 드롭다운: 이름 (ID) 표시, 동명이인 구분 */}
          <div ref={dropdownRef} className="relative">
            <label className="block text-sm font-medium text-gray-700">전화할 케어대상</label>
            <input
              type="text"
              value={displayValue}
              onChange={handleCareTargetInputChange}
              onFocus={handleCareTargetInputFocus}
              placeholder="이름으로 검색 (예: 홍길동)"
              className="mt-1 block w-full border rounded-md p-2 pr-8"
              autoComplete="off"
            />
            {showCareTargetDropdown && (
              <ul className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-52 overflow-y-auto">
                {loadingCareTargets ? (
                  <li className="p-3 text-sm text-gray-500">검색 중...</li>
                ) : filteredList.length === 0 ? (
                  <li className="p-3 text-sm text-gray-500">검색 결과가 없습니다.</li>
                ) : (
                  filteredList.map((item) => (
                    <li
                      key={item.careTargetId}
                      role="button"
                      onClick={() => handleCareTargetSelect(item)}
                      className="px-3 py-2 text-sm hover:bg-teal-50 cursor-pointer border-b border-gray-100 last:border-0"
                    >
                      {item.name} ({item.careTargetId})
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {/* 해당 업체 시나리오 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              시나리오 선택 (통화 시 사용)
            </label>
            <div className="max-h-32 overflow-y-auto border rounded-md p-2 bg-gray-50 space-y-1">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-100">
                <input
                  type="radio"
                  name="scenarioId"
                  checked={formData.scenarioId == null}
                  onChange={() => setFormData((prev) => ({ ...prev, scenarioId: null }))}
                  className="text-[#008080]"
                />
                <span className="text-sm text-gray-600">미지정</span>
              </label>
              {scenarios.map((sc) => (
                <label
                  key={sc.scenarioId}
                  className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-100"
                >
                  <input
                    type="radio"
                    name="scenarioId"
                    checked={formData.scenarioId === sc.scenarioId}
                    onChange={() =>
                      setFormData((prev) => ({ ...prev, scenarioId: sc.scenarioId }))
                    }
                    className="text-[#008080]"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-800">{sc.scenarioName}</span>
                    {sc.scenarioDescription && (
                      <p className="text-xs text-gray-500">{sc.scenarioDescription}</p>
                    )}
                  </div>
                </label>
              ))}
              {scenarios.length === 0 && (
                <p className="text-xs text-gray-500 p-2">사용 가능한 시나리오가 없습니다.</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">예정 시간</label>
            <input
              type="datetime-local"
              name="scheduledTime"
              required
              value={formData.scheduledTime}
              onChange={handleChange}
              className="mt-1 block w-full border rounded-md p-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">일정 유형</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full border rounded-md p-2"
              >
                <option value="ONE_TIME">일회성</option>
                <option value="RECURRING">반복</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">우선순위</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="mt-1 block w-full border rounded-md p-2"
              >
                <option value="LOW">낮음</option>
                <option value="MEDIUM">보통</option>
                <option value="HIGH">높음</option>
                <option value="URGENT">긴급</option>
              </select>
            </div>
          </div>

          {formData.type === "RECURRING" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">반복 주기</label>
                <select
                  name="recurrence"
                  value={formData.recurrence}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded-md p-2"
                >
                  <option value="">선택</option>
                  <option value="DAILY">일일</option>
                  <option value="WEEKLY">주간</option>
                  <option value="MONTHLY">월간</option>
                </select>
              </div>
              {formData.recurrence && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    반복 종료일 (선택)
                  </label>
                  <input
                    type="datetime-local"
                    name="recurrenceEndDate"
                    value={formData.recurrenceEndDate}
                    onChange={handleChange}
                    className="mt-1 block w-full border rounded-md p-2"
                    min={formData.scheduledTime || undefined}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    반복 일정이 종료될 날짜와 시간을 선택하세요. 선택하지 않으면 무기한 반복됩니다.
                  </p>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">메모</label>
            <textarea
              name="memo"
              rows="3"
              value={formData.memo}
              onChange={handleChange}
              className="mt-1 block w-full border rounded-md p-2"
              placeholder="통화 시 참고할 내용을 적어주세요."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!orgId}
              className="px-4 py-2 bg-[#008080] text-white rounded-md hover:bg-[#006666] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingSchedule ? "수정하기" : "등록하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleModal;
