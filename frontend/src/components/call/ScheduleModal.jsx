import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  CalendarPlus,
  User,
  Clock,
  FileText,
  CalendarClock,
} from "lucide-react";
import { createSchedule, updateSchedule } from "../../api/callApi";
import { getCareTargetAllList } from "../../api/caretarget/careTargetApi";
import {
  getScenarioList,
  getCareGroupList,
} from "../../api/caretarget/careTargetGroupApi";

const DEBOUNCE_MS = 300;

const getPriorityStyle = (priority) => {
  const p = priority?.toUpperCase();
  if (p === "URGENT")
    return "bg-gradient-to-br from-red-500/20 to-red-600/20 text-red-400 border border-red-500/50";
  if (p === "HIGH")
    return "bg-gradient-to-br from-orange-500/20 to-orange-600/20 text-orange-400 border border-orange-500/50";
  if (p === "MEDIUM")
    return "bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 text-yellow-400 border border-yellow-500/50";
  return "bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 text-emerald-400 border border-emerald-500/50";
};

const ScheduleModal = ({
  isOpen,
  onClose,
  onSaveSuccess,
  organizationId,
  editingSchedule,
  viewOnly = false,
  onSwitchToEdit,
}) => {
  const orgId = organizationId ?? null;

  const [formData, setFormData] = useState({
    organizationId: orgId,
    careTargetId: "",
    groupId: null,
    scenarioId: null,
    scheduledTime: "",
    type: "ONE_TIME",
    priority: "MEDIUM",
    memo: "",
    recurrence: "",
    recurrenceEndDate: "",
  });

  const [targetType, setTargetType] = useState("CARE_TARGET"); // "CARE_TARGET" 또는 "GROUP"
  const [careTargetSearch, setCareTargetSearch] = useState("");
  const [careTargetList, setCareTargetList] = useState([]);
  const [showCareTargetDropdown, setShowCareTargetDropdown] = useState(false);
  const [selectedCareTargetDisplay, setSelectedCareTargetDisplay] =
    useState(""); // "홍길동 (123)"
  const [groupSearch, setGroupSearch] = useState("");
  const [groupList, setGroupList] = useState([]);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [selectedGroupDisplay, setSelectedGroupDisplay] = useState("");
  const [scenarios, setScenarios] = useState([]);
  const [loadingCareTargets, setLoadingCareTargets] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const debounceRef = useRef(null);
  const dropdownRef = useRef(null);
  const groupDropdownRef = useRef(null);

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
    [orgId],
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

  const fetchGroups = useCallback(async () => {
    if (!orgId) return [];
    setLoadingGroups(true);
    try {
      const data = await getCareGroupList(orgId);
      const groups = Array.isArray(data) ? data : [];
      setGroupList(groups);
      return groups;
    } catch (e) {
      console.error("그룹 목록 조회 실패:", e);
      setGroupList([]);
      return [];
    } finally {
      setLoadingGroups(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (!isOpen) return;
    fetchScenarios();
    fetchGroups();
    setCareTargetSearch("");
    setGroupSearch("");
    setCareTargetList([]);
    setGroupList([]);
    setShowCareTargetDropdown(false);
    setShowGroupDropdown(false);
    if (!editingSchedule) {
      setSelectedCareTargetDisplay("");
      setSelectedGroupDisplay("");
      setTargetType("CARE_TARGET");
      fetchCareTargets("");
    }
  }, [isOpen, editingSchedule, fetchScenarios, fetchCareTargets, fetchGroups]);

  useEffect(() => {
    if (!isOpen || !editingSchedule) return;

    // editingSchedule에서 targetType 확인 (targetType이 GROUP이거나 targetGroupName이 있으면 GROUP)
    const isGroupSchedule =
      editingSchedule.targetType === "GROUP" || editingSchedule.targetGroupName;

    if (isGroupSchedule) {
      setTargetType("GROUP");
      setSelectedGroupDisplay(
        editingSchedule.targetGroupName || editingSchedule.careTargetName || "",
      );
      setGroupSearch("");
      setSelectedCareTargetDisplay("");
      setCareTargetSearch("");

      // 그룹 목록을 먼저 로드한 후 groupId를 찾아서 설정
      fetchGroups().then((groups) => {
        if (editingSchedule.groupId && groups) {
          // groupId가 있으면 바로 설정
          setFormData((prev) => ({
            ...prev,
            groupId: editingSchedule.groupId,
          }));
        } else if (editingSchedule.targetGroupName && groups) {
          // groupId가 없고 targetGroupName이 있으면 그룹 목록에서 찾아서 설정
          const foundGroup = groups.find(
            (g) => g.groupName === editingSchedule.targetGroupName,
          );
          if (foundGroup) {
            setFormData((prev) => ({ ...prev, groupId: foundGroup.groupId }));
          }
        }
      });
    } else {
      setTargetType("CARE_TARGET");
      const name = editingSchedule.careTargetName || "대상자";
      const id = editingSchedule.careTargetId;
      setSelectedCareTargetDisplay(id != null ? `${name} (${id})` : name);
      setCareTargetSearch("");
      setSelectedGroupDisplay("");
      setGroupSearch("");
    }
  }, [isOpen, editingSchedule, fetchGroups]);

  // targetType 변경 시 초기화 (editingSchedule이 있을 때는 실행하지 않음)
  useEffect(() => {
    if (!isOpen || editingSchedule) return; // editingSchedule이 있으면 초기화하지 않음
    if (targetType === "CARE_TARGET") {
      setFormData((prev) => ({ ...prev, careTargetId: "", groupId: null }));
      setSelectedGroupDisplay("");
      setGroupSearch("");
    } else {
      setFormData((prev) => ({ ...prev, careTargetId: "", groupId: null }));
      setSelectedCareTargetDisplay("");
      setCareTargetSearch("");
    }
  }, [targetType, isOpen, editingSchedule]);

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
  }, [
    careTargetSearch,
    isOpen,
    showCareTargetDropdown,
    selectedCareTargetDisplay,
    fetchCareTargets,
  ]);

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
      groupId: editingSchedule.groupId ?? null,
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
      groupId: null,
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
      if (
        groupDropdownRef.current &&
        !groupDropdownRef.current.contains(e.target)
      ) {
        setShowGroupDropdown(false);
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
    if (!careTargetList.length && !loadingCareTargets)
      fetchCareTargets(careTargetSearch);
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

    // 개인 또는 그룹 중 하나는 반드시 선택되어야 함
    if (targetType === "CARE_TARGET" && !formData.careTargetId) {
      alert("전화할 케어대상을 선택해주세요.");
      return;
    }
    if (targetType === "GROUP" && !formData.groupId) {
      alert("전화할 그룹을 선택해주세요.");
      return;
    }

    try {
      const payload = {
        organizationId: orgId,
        careTargetId:
          targetType === "CARE_TARGET" ? formData.careTargetId : null,
        groupId: targetType === "GROUP" ? formData.groupId : null,
        scenarioId: formData.scenarioId || null,
        scheduledTime: formData.scheduledTime,
        type: formData.type,
        priority: formData.priority,
        recurrence:
          formData.type === "RECURRING" ? formData.recurrence || null : null,
        recurrenceEndDate:
          formData.type === "RECURRING" && formData.recurrenceEndDate
            ? formData.recurrenceEndDate
            : null,
        memo: formData.memo,
      };

      if (editingSchedule) {
        await updateSchedule(orgId, editingSchedule.scheduleId, payload);
        alert("일정이 성공적으로 수정되었습니다.");
      } else {
        await createSchedule(orgId, payload);
        alert("일정이 성공적으로 등록되었습니다.");
      }
      onSaveSuccess();
      onClose();
    } catch (error) {
      console.error(
        editingSchedule ? "일정 수정 실패:" : "일정 등록 실패:",
        error,
      );
      alert(
        editingSchedule
          ? "수정 중 오류가 발생했습니다."
          : "등록 중 오류가 발생했습니다.",
      );
    }
  };

  if (!isOpen) return null;

  const s = editingSchedule;
  const typeLabel = s?.type === "RECURRING" ? "반복" : "일회성";
  const recurrenceLabel =
    { DAILY: "일일", WEEKLY: "주간", MONTHLY: "월간" }[s?.recurrence] ||
    s?.recurrence ||
    "-";

  if (viewOnly && s) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-sm shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-5 border-b border-cp-border bg-gradient-to-r from-cp-card to-cp-bg shrink-0">
            <h3 className="text-xl font-bold text-cp-text flex items-center gap-2">
              <CalendarClock size={24} className="text-teal-400" />
              통화 일정 상세
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-sm text-cp-muted hover:bg-cp-bg hover:text-cp-text transition-all"
            >
              <X size={24} />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold text-cp-muted uppercase tracking-wider mb-0.5">
                  대상자
                </dt>
                <dd className="text-cp-text">
                  {s.targetType === "GROUP"
                    ? `그룹: ${s.targetGroupName ?? "이름 없음"}`
                    : (s.careTargetName ?? "-")}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-cp-muted uppercase tracking-wider mb-0.5">
                  예정 시간
                </dt>
                <dd className="text-cp-text">
                  {s.nextRunAt || s.scheduledTime || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-cp-muted uppercase tracking-wider mb-0.5">
                  유형
                </dt>
                <dd className="text-cp-text">{s.typeLabel || typeLabel}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-cp-muted uppercase tracking-wider mb-0.5">
                  우선순위
                </dt>
                <dd>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-semibold rounded-sm border ${s.status === "CANCELLED" ? "bg-cp-muted text-white" : getPriorityStyle(s.priority)}`}
                  >
                    {s.priorityLabel || s.priority || "-"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-cp-muted uppercase tracking-wider mb-0.5">
                  상태
                </dt>
                <dd>
                  <span
                    className={
                      s.status === "CANCELLED"
                        ? "text-cp-muted"
                        : "text-emerald-400"
                    }
                  >
                    ● {s.statusLabel || s.status || "-"}
                  </span>
                </dd>
              </div>
              {s.type === "RECURRING" && (
                <>
                  <div>
                    <dt className="text-xs font-semibold text-cp-muted uppercase tracking-wider mb-0.5">
                      반복 주기
                    </dt>
                    <dd className="text-cp-text">{recurrenceLabel}</dd>
                  </div>
                  {s.recurrenceEndDate && (
                    <div>
                      <dt className="text-xs font-semibold text-cp-muted uppercase tracking-wider mb-0.5">
                        반복 종료일
                      </dt>
                      <dd className="text-cp-text">{s.recurrenceEndDate}</dd>
                    </div>
                  )}
                </>
              )}
              <div>
                <dt className="text-xs font-semibold text-cp-muted uppercase tracking-wider mb-0.5">
                  메모
                </dt>
                <dd className="text-cp-text mt-1 p-3 bg-cp-bg/50 rounded-sm border border-cp-border whitespace-pre-wrap break-words">
                  {s.memo || "-"}
                </dd>
              </div>
            </dl>
          </div>
          <div className="p-5 border-t border-cp-border flex-shrink-0 flex gap-3 justify-end bg-gradient-to-r from-cp-card/80 to-cp-bg/80">
            {s.status !== "CANCELLED" && onSwitchToEdit && (
              <button
                type="button"
                onClick={() => onSwitchToEdit(s)}
                className="px-4 py-2.5 rounded-sm font-semibold text-sm bg-cp-input border border-cp-border text-cp-text hover:bg-cp-bg transition-all"
              >
                수정
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-sm font-semibold text-sm bg-gradient-to-br from-teal-600 to-teal-700 border border-teal-500 text-white hover:from-teal-500 hover:to-teal-600 transition-all"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayValue = selectedCareTargetDisplay || careTargetSearch;
  const filteredList = careTargetList.filter((item) => {
    const name = (item.name || "").toLowerCase();
    const keyword = (careTargetSearch || "").toLowerCase();
    return !keyword || name.startsWith(keyword) || name.includes(keyword);
  });

  const inputClass =
    "w-full p-2.5 border border-cp-border rounded-sm bg-cp-input text-cp-text placeholder:text-cp-muted focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all";
  const labelClass = "block text-sm font-semibold text-cp-text mb-1.5";
  const selectClass =
    "w-full p-2.5 border border-cp-border rounded-sm bg-cp-input text-cp-text focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none cursor-pointer";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-sm shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-5 border-b border-cp-border bg-gradient-to-r from-cp-card to-cp-bg shrink-0">
          <h3 className="text-xl font-bold text-cp-text flex items-center gap-2">
            <CalendarPlus size={24} className="text-teal-400" />
            {editingSchedule ? "통화 일정 수정" : "새 통화 일정 등록"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-sm text-cp-muted hover:bg-cp-bg hover:text-cp-text transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto flex-1 space-y-5"
        >
          {!orgId && (
            <p className="text-amber-400 bg-amber-500/20 border border-amber-500/50 rounded-sm p-4 text-sm">
              업체 정보가 없습니다. 로그인 상태를 확인해주세요.
            </p>
          )}
          {/* 대상자 타입 선택 (개인/그룹) */}
          <div>
            <label className={labelClass}>대상자 타입</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-cp-bg/50 transition-colors">
                <input
                  type="radio"
                  name="targetType"
                  value="CARE_TARGET"
                  checked={targetType === "CARE_TARGET"}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="text-teal-500 focus:ring-teal-500"
                />
                <span className="text-sm text-cp-text">개인 대상자</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-cp-bg/50 transition-colors">
                <input
                  type="radio"
                  name="targetType"
                  value="GROUP"
                  checked={targetType === "GROUP"}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="text-teal-500 focus:ring-teal-500"
                />
                <span className="text-sm text-cp-text">그룹</span>
              </label>
            </div>
          </div>

          {/* 개인 대상자 선택 (targetType이 CARE_TARGET일 때만 표시) */}
          {targetType === "CARE_TARGET" && (
            <div ref={dropdownRef} className="relative">
              <label className={labelClass}>전화할 케어대상</label>
              <input
                type="text"
                value={displayValue}
                onChange={handleCareTargetInputChange}
                onFocus={handleCareTargetInputFocus}
                placeholder="이름으로 검색 (예: 홍길동)"
                className={`mt-1 ${inputClass}`}
                autoComplete="off"
              />
              {showCareTargetDropdown && (
                <ul className="absolute z-20 w-full mt-1 bg-cp-card border border-cp-border rounded-sm shadow-xl max-h-52 overflow-y-auto">
                  {loadingCareTargets ? (
                    <li className="p-3 text-sm text-cp-muted">로딩 중...</li>
                  ) : filteredList.length === 0 ? (
                    <li className="p-3 text-sm text-cp-muted">
                      검색 결과가 없습니다.
                    </li>
                  ) : (
                    filteredList.map((item) => (
                      <li
                        key={item.careTargetId}
                        role="button"
                        onClick={() => handleCareTargetSelect(item)}
                        className="px-3 py-2 text-sm text-cp-text hover:bg-cp-bg cursor-pointer border-b border-cp-border/50 last:border-0 transition-colors"
                      >
                        {item.name} ({item.careTargetId})
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          )}

          {/* 그룹 선택 (targetType이 GROUP일 때만 표시) */}
          {targetType === "GROUP" && (
            <div ref={groupDropdownRef} className="relative">
              <label className={labelClass}>전화할 그룹</label>
              <input
                type="text"
                value={selectedGroupDisplay || groupSearch}
                onChange={(e) => {
                  setGroupSearch(e.target.value);
                  setShowGroupDropdown(true);
                  if (!e.target.value) {
                    setFormData((prev) => ({ ...prev, groupId: null }));
                    setSelectedGroupDisplay("");
                  }
                }}
                onFocus={() => {
                  setShowGroupDropdown(true);
                  if (!groupList.length && !loadingGroups) fetchGroups();
                }}
                placeholder="그룹 이름으로 검색"
                className={`mt-1 ${inputClass}`}
                autoComplete="off"
              />
              {showGroupDropdown && (
                <ul className="absolute z-20 w-full mt-1 bg-cp-card border border-cp-border rounded-sm shadow-xl max-h-52 overflow-y-auto">
                  {loadingGroups ? (
                    <li className="p-3 text-sm text-cp-muted">로딩 중...</li>
                  ) : groupList.length === 0 ? (
                    <li className="p-3 text-sm text-cp-muted">
                      검색 결과가 없습니다.
                    </li>
                  ) : (
                    groupList
                      .filter((item) => {
                        const name = (item.groupName || "").toLowerCase();
                        const keyword = (groupSearch || "").toLowerCase();
                        return (
                          !keyword ||
                          name.startsWith(keyword) ||
                          name.includes(keyword)
                        );
                      })
                      .map((item) => (
                        <li
                          key={item.groupId}
                          role="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              groupId: item.groupId,
                            }));
                            setSelectedGroupDisplay(item.groupName);
                            setGroupSearch("");
                            setShowGroupDropdown(false);
                          }}
                          className="px-3 py-2 text-sm text-cp-text hover:bg-cp-bg cursor-pointer border-b border-cp-border/50 last:border-0 transition-colors"
                        >
                          {item.groupName}
                        </li>
                      ))
                  )}
                </ul>
              )}
            </div>
          )}

          {/* 해당 업체 시나리오 선택 */}
          <div>
            <label className={labelClass}>시나리오 선택 (통화 시 사용)</label>
            <div className="max-h-32 overflow-y-auto border border-cp-border rounded-sm p-2 bg-cp-bg/50 space-y-1">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-cp-bg/50 transition-colors">
                <input
                  type="radio"
                  name="scenarioId"
                  checked={formData.scenarioId == null}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, scenarioId: null }))
                  }
                  className="text-teal-500 focus:ring-teal-500"
                />
                <span className="text-sm text-cp-text">미지정</span>
              </label>
              {scenarios.map((sc) => (
                <label
                  key={sc.scenarioId}
                  className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-cp-bg/50 transition-colors"
                >
                  <input
                    type="radio"
                    name="scenarioId"
                    checked={formData.scenarioId === sc.scenarioId}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        scenarioId: sc.scenarioId,
                      }))
                    }
                    className="text-teal-500 focus:ring-teal-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-cp-text">
                      {sc.scenarioName}
                    </span>
                    {sc.scenarioDescription && (
                      <p className="text-xs text-cp-muted">
                        {sc.scenarioDescription}
                      </p>
                    )}
                  </div>
                </label>
              ))}
              {scenarios.length === 0 && (
                <p className="text-xs text-cp-muted p-2">
                  사용 가능한 시나리오가 없습니다.
                </p>
              )}
            </div>
          </div>

          {/* 예정 시간 / 유형·우선순위 */}
          <div className="flex items-center gap-2 pb-1 border-b border-cp-border text-teal-400 font-bold text-sm">
            <Clock size={16} />
            일정 설정
          </div>
          <div>
            <label className={labelClass}>예정 시간</label>
            <input
              type="datetime-local"
              name="scheduledTime"
              required
              value={formData.scheduledTime}
              onChange={handleChange}
              className={`${inputClass}`}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>일정 유형</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="ONE_TIME" className="bg-cp-card">
                  일회성
                </option>
                <option value="RECURRING" className="bg-cp-card">
                  반복
                </option>
              </select>
            </div>
            <div>
              <label className={labelClass}>우선순위</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="LOW" className="bg-cp-card">
                  낮음
                </option>
                <option value="MEDIUM" className="bg-cp-card">
                  보통
                </option>
                <option value="HIGH" className="bg-cp-card">
                  높음
                </option>
                <option value="URGENT" className="bg-cp-card">
                  긴급
                </option>
              </select>
            </div>
          </div>

          {formData.type === "RECURRING" && (
            <>
              <div>
                <label className={labelClass}>반복 주기</label>
                <select
                  name="recurrence"
                  value={formData.recurrence}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="" className="bg-cp-card">
                    선택
                  </option>
                  <option value="DAILY" className="bg-cp-card">
                    일일
                  </option>
                  <option value="WEEKLY" className="bg-cp-card">
                    주간
                  </option>
                  <option value="MONTHLY" className="bg-cp-card">
                    월간
                  </option>
                </select>
              </div>
              {formData.recurrence && (
                <div>
                  <label className={labelClass}>반복 종료일 (선택)</label>
                  <input
                    type="datetime-local"
                    name="recurrenceEndDate"
                    value={formData.recurrenceEndDate}
                    onChange={handleChange}
                    className={`${inputClass}`}
                    min={formData.scheduledTime || undefined}
                  />
                  <p className="mt-1 text-xs text-cp-muted">
                    반복 일정이 종료될 날짜와 시간을 선택하세요. 선택하지 않으면
                    무기한 반복됩니다.
                  </p>
                </div>
              )}
            </>
          )}

          {/* 메모 */}
          <div>
            <label className={`${labelClass} flex items-center gap-2`}>
              <FileText size={16} className="text-teal-400" />
              메모
            </label>
            <textarea
              name="memo"
              rows="3"
              value={formData.memo}
              onChange={handleChange}
              className={`${inputClass} resize-none`}
              placeholder="통화 시 참고할 내용을 적어주세요."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-cp-input border border-cp-border text-cp-text rounded-sm font-semibold hover:bg-cp-bg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!orgId}
              className="flex-1 py-3 bg-gradient-to-br from-teal-600 to-teal-700 border border-teal-500 text-white rounded-sm font-semibold hover:from-teal-500 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:hover:translate-y-0"
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
