import React, { useEffect, useMemo, useState } from "react";
import {
  getUpcomingSchedules,
  deleteSchedule,
  restoreSchedule,
} from "../../api/call/callApi";
import ScheduleModal from "./ScheduleModal";
import { useSelector } from "react-redux";
import { CalendarDays } from "lucide-react";
import CustomMonthPicker from "../common/CustomMonthPicker";

// 우선순위별 스타일 (위험도와 동일)
const getPriorityStyle = (priority) => {
  const p = priority?.toUpperCase();
  if (p === "URGENT" || p === "CRITICAL" || p === "긴급")
    return "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/50";
  if (p === "HIGH" || p === "위험")
    return "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/50";
  if (p === "MEDIUM" || p === "보통")
    return "bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/50";
  return "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/50";
};
const getPriorityDotColor = (priority) => {
  const p = priority?.toUpperCase();
  if (p === "URGENT") return "bg-red-500";
  if (p === "HIGH") return "bg-orange-500";
  if (p === "MEDIUM") return "bg-yellow-500";
  return "bg-emerald-500";
};

const CallScheduleTab = () => {
  const { user } = useSelector((state) => state.auth);
  const organizationId = user?.organizationId ?? null; // 로그인 사용자 업체 ID (없으면 null)
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleViewOnly, setScheduleViewOnly] = useState(false);
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [sortCriterion, setSortCriterion] = useState("TIME");
  const [expandedDay, setExpandedDay] = useState(null); // 확장된 날짜 상태

  useEffect(() => {
    fetchSchedules();
  }, [organizationId]);

  const fetchSchedules = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const data = await getUpcomingSchedules(organizationId);
      setSchedules(data);
    } catch (error) {
      console.error("일정 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setIsModalOpen(true);
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm("정말 이 일정을 취소하시겠습니까?")) {
      return;
    }

    if (!organizationId) return;
    try {
      await deleteSchedule(organizationId, scheduleId);
      alert("일정이 성공적으로 취소되었습니다.");
      fetchSchedules(); // 목록 새로고침
    } catch (error) {
      console.error("일정 삭제 실패:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleRestore = async (scheduleId) => {
    if (!window.confirm("이 일정을 복구하시겠습니까?")) {
      return;
    }

    if (!organizationId) return;
    try {
      await restoreSchedule(organizationId, scheduleId);
      alert("일정이 성공적으로 복구되었습니다.");
      fetchSchedules(); // 목록 새로고침
    } catch (error) {
      console.error("일정 복구 실패:", error);
      alert("복구 중 오류가 발생했습니다.");
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingSchedule(null);
    setScheduleViewOnly(false);
  };

  const handleOpenDetail = (schedule) => {
    setEditingSchedule(schedule);
    setScheduleViewOnly(true);
    setIsModalOpen(true);
  };

  const handleSwitchToEdit = (schedule) => {
    setEditingSchedule(schedule);
    setScheduleViewOnly(false);
  };

  const formatYMD = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

  const calendarCells = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = daysInMonth(year, month);
    const totalCells = Math.ceil((firstDay + totalDays) / 7) * 7;

    return Array.from({ length: totalCells }).map((_, index) => {
      const dayNumber = index - firstDay + 1;
      if (dayNumber < 1 || dayNumber > totalDays) {
        return { dayNumber: null, date: null };
      }
      const dayDate = new Date(year, month, dayNumber);
      return { dayNumber, date: dayDate };
    });
  }, [calendarDate]);

  const monthLabel = `${calendarDate.getFullYear()}년 ${calendarDate.toLocaleString(
    "ko-KR",
    {
      month: "long",
    },
  )}`;

  const calendarMonthValue = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, "0")}`;

  const handleCalendarMonthChange = (val) => {
    if (!val) return;
    const [y, m] = val.split("-").map(Number);
    setCalendarDate(new Date(y, m - 1, 1));
  };

  const moveMonth = (direction) => {
    setCalendarDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + direction);
      return next;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCalendarDate(today);
    setSelectedDate(today);
  };

  const isSameDay = (target, reference) =>
    target &&
    reference &&
    target.getFullYear() === reference.getFullYear() &&
    target.getMonth() === reference.getMonth() &&
    target.getDate() === reference.getDate();

  const sortedSchedules = useMemo(() => {
    const rows = [...schedules];

    // 취소된 항목과 활성 항목 분리
    const activeRows = rows.filter((r) => r.status !== "CANCELLED");
    const cancelledRows = rows.filter((r) => r.status === "CANCELLED");

    // nextRunAt 또는 scheduledTime을 가져오는 헬퍼 함수
    const getDisplayTime = (schedule) =>
      schedule.nextRunAt || schedule.scheduledTime;

    // 활성 항목 정렬
    if (sortCriterion === "PRIORITY") {
      const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      activeRows.sort((a, b) => {
        const aWeight = priorityOrder[a.priority] || 0;
        const bWeight = priorityOrder[b.priority] || 0;
        return bWeight - aWeight; // descending priority
      });
    } else {
      activeRows.sort((a, b) => {
        const aTimeStr = getDisplayTime(a);
        const bTimeStr = getDisplayTime(b);
        if (!aTimeStr || !bTimeStr) return 0;
        const aTime = new Date(aTimeStr).getTime();
        const bTime = new Date(bTimeStr).getTime();
        return aTime - bTime;
      });
    }

    // 취소된 항목도 시간순으로 정렬
    cancelledRows.sort((a, b) => {
      const aTimeStr = getDisplayTime(a);
      const bTimeStr = getDisplayTime(b);
      if (!aTimeStr || !bTimeStr) return 0;
      const aTime = new Date(aTimeStr).getTime();
      const bTime = new Date(bTimeStr).getTime();
      return aTime - bTime;
    });

    // 활성 항목 먼저, 취소된 항목은 아래로
    return [...activeRows, ...cancelledRows];
  }, [schedules, sortCriterion]);

  const scheduleByDay = useMemo(() => {
    const map = {};
    // 캘린더에는 취소되지 않은 일정만 표시
    sortedSchedules
      .filter((s) => s.status !== "CANCELLED")
      .forEach((schedule) => {
        // nextRunAt 우선 사용, 없으면 scheduledTime 사용
        const displayTime = schedule.nextRunAt || schedule.scheduledTime;
        if (!displayTime) return;
        const key = displayTime.split(" ")[0];
        if (!map[key]) {
          map[key] = [];
        }
        map[key].push(schedule);
      });
    return map;
  }, [sortedSchedules]);

  const scheduleDays = useMemo(
    () => new Set(Object.keys(scheduleByDay)),
    [scheduleByDay],
  );

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-sm border border-cp-border bg-cp-card overflow-hidden shadow-sm">
          {/* 상단 헤더 섹션 - 배경색 명확하게 차이 부여 (라이트모드 대비 강화) */}
          <div className="bg-slate-50 dark:bg-black/40 border-b border-cp-border p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-sm bg-teal-500/10 text-teal-500 border border-teal-500/20 shadow-inner">
                  <CalendarDays size={22} />
                </div>
                <h3 className="text-2xl font-black text-cp-text tracking-tight">
                  {monthLabel}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <CustomMonthPicker
                  value={calendarMonthValue}
                  onChange={handleCalendarMonthChange}
                />
                <div className="flex items-center gap-1.5 ml-1">
                  <button
                    type="button"
                    className="h-10 rounded-sm border border-cp-border bg-white dark:bg-cp-input px-4 text-cp-text text-sm font-bold hover:bg-slate-50 dark:hover:bg-cp-bg hover:border-teal-500/50 transition-all shadow-sm active:translate-y-0.5"
                    onClick={() => moveMonth(-1)}
                  >
                    이전달
                  </button>
                  <button
                    type="button"
                    className="h-10 rounded-sm border border-teal-500/50 bg-teal-500 text-white px-5 text-sm font-bold hover:bg-teal-600 transition-all shadow-md active:scale-95"
                    onClick={goToToday}
                  >
                    오늘
                  </button>
                  <button
                    type="button"
                    className="h-10 rounded-sm border border-cp-border bg-white dark:bg-cp-input px-4 text-cp-text text-sm font-bold hover:bg-slate-50 dark:hover:bg-cp-bg hover:border-teal-500/50 transition-all shadow-sm active:translate-y-0.5"
                    onClick={() => moveMonth(1)}
                  >
                    다음달
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 달력 본문 영역 */}
          <div className="p-4 bg-white dark:bg-cp-card">
            <div className="mb-3 grid grid-cols-7 gap-2 text-xs font-black uppercase text-cp-muted tracking-widest border-b border-cp-border/30 pb-2">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((label, idx) => (
                <div key={label} className={`py-1 text-center ${idx === 0 ? 'text-red-500/80' : idx === 6 ? 'text-blue-500/80' : ''}`}>
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 text-sm">
              {calendarCells.map((cell, index) => {
                const isToday = cell.date
                  ? isSameDay(cell.date, new Date())
                  : false;
                const isSelected = cell.date
                  ? isSameDay(cell.date, selectedDate)
                  : false;
                const dayKey = cell.date ? formatYMD(cell.date) : null;
                const dayEvents = dayKey ? scheduleByDay[dayKey] || [] : [];
                const hasSchedule = dayEvents.length > 0;
                const isExpanded = expandedDay === dayKey;
                const maxVisible = isExpanded ? dayEvents.length : 2;
                const visibleEvents = dayEvents.slice(0, maxVisible);
                const hasMore = dayEvents.length > maxVisible;

                const baseClasses =
                  "flex h-24 flex-col items-start justify-start rounded border px-2 py-1 transition relative overflow-hidden";
                // 날짜가 없는 칸(이전/다음달 일부)과 현재 달의 칸 배경색 구분 (라이트모드 명확화)
                const bgClass = cell.date 
                  ? (isToday ? "bg-teal-50 dark:bg-teal-950/30" : "bg-white dark:bg-white/5") 
                  : "bg-slate-100 dark:bg-black/20 opacity-60";
                
                const borderClass = isSelected
                  ? "border-teal-500 ring-1 ring-teal-500/30"
                  : hasSchedule
                    ? "border-teal-500/40"
                    : "border-cp-border/60";
                
                const todayClass = isToday ? "border-teal-500/50 dark:border-teal-500/20 border-2" : "";
                
                return (
                  <div
                    key={`cell-${index}`}
                    role={cell.date ? "button" : undefined}
                    tabIndex={cell.date ? 0 : -1}
                    className={`${baseClasses} ${bgClass} ${borderClass} ${todayClass} ${cell.date ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-white/10" : "cursor-not-allowed"}`}
                    onClick={() => cell.date && setSelectedDate(cell.date)}
                    onKeyDown={(e) => {
                      if (cell.date && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        setSelectedDate(cell.date);
                      }
                    }}
                  >
                    <span className={`text-sm font-bold mb-1 ${isToday ? 'text-teal-500' : (cell.date ? 'text-cp-text' : 'text-cp-muted')}`}>
                      {cell.dayNumber ?? ""}
                    </span>
                    <div className="flex flex-col gap-1 w-full overflow-y-auto calendar-cell-scrollbar">
                      {visibleEvents.map((event) => {
                        const targetName =
                          event.careTargetName || event.targetGroupName || "대상";
                        // nextRunAt 우선 사용, 없으면 scheduledTime 사용
                        const displayTime = event.nextRunAt || event.scheduledTime;
                        const timeStr = displayTime ? displayTime.slice(-5) : "";
                        const eventText = `${targetName} · ${timeStr}`;
                        const fullText = event.memo
                          ? `${eventText} - ${event.memo}`
                          : eventText;

                        const dotColor = getPriorityDotColor(event.priority);

                        return (
                          <div
                            key={event.scheduleId}
                            className="flex items-center gap-1.5 min-w-0 cursor-pointer group hover:opacity-90 transition bg-slate-100 dark:bg-black/20 px-1.5 py-0.5 rounded-sm"
                            title={fullText}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(event);
                            }}
                          >
                            <span
                              className={`shrink-0 w-1.5 h-1.5 rounded-full ${dotColor}`}
                              aria-hidden
                            />
                            <span className="text-[12px] text-cp-text truncate min-w-0 font-bold">
                              {targetName} / {timeStr || "시간 미정"}
                            </span>
                          </div>
                        );
                      })}
                      {hasMore && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedDay(isExpanded ? null : dayKey);
                          }}
                          className="text-[9px] text-teal-500 hover:text-teal-400 font-bold px-1 py-0.5 rounded-none hover:bg-teal-500/10 transition"
                        >
                          +{dayEvents.length - maxVisible}개 더보기
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center bg-cp-bg/50 p-4 rounded-sm border border-cp-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sm bg-gradient-to-br from-teal-500/20 to-teal-600/20 text-teal-400 border border-teal-500/50 shadow-sm">
              <CalendarDays size={20} />
            </div>
            <h2 className="text-lg font-bold text-cp-text">통화 예정 일정</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-sm bg-cp-card px-2 py-1 border border-cp-border">
              <button
                type="button"
                className={`h-8 rounded-sm px-3 text-xs font-medium transition ${
                  sortCriterion === "TIME"
                    ? "bg-teal-600 text-white border border-teal-500"
                    : "bg-transparent text-cp-muted hover:text-teal-400 border border-transparent"
                }`}
                onClick={() => setSortCriterion("TIME")}
              >
                시간순
              </button>
              <button
                type="button"
                className={`h-8 rounded-sm px-3 text-xs font-medium transition ${
                  sortCriterion === "PRIORITY"
                    ? "bg-teal-600 text-white border border-teal-500"
                    : "bg-transparent text-cp-muted hover:text-teal-400 border border-transparent"
                }`}
                onClick={() => setSortCriterion("PRIORITY")}
              >
                우선순위순
              </button>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-teal-600 text-white px-4 py-2 rounded-sm border border-teal-500 hover:bg-teal-500 transition"
            >
              + 일정 추가
            </button>
          </div>
        </div>

        <div className="bg-cp-card border border-cp-border rounded-sm overflow-hidden">
          <table className="w-full text-center">
            <thead className="bg-cp-header text-white dark:text-cp-muted uppercase text-sm border-b-2 border-teal-500/30">
              <tr>
                <th className="p-3 text-white dark:text-teal-400">대상자</th>
                <th className="p-3 text-white dark:text-teal-400">예정 시간</th>
                <th className="p-3 text-white dark:text-teal-400">유형</th>
                <th className="p-3 text-white dark:text-teal-400">우선순위</th>
                <th className="p-3 text-white dark:text-teal-400">상태</th>
                <th className="p-3 text-white dark:text-teal-400">메모</th>
                <th className="p-3 text-white dark:text-teal-400">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cp-border">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-cp-muted">
                    로딩 중...
                  </td>
                </tr>
              ) : sortedSchedules.length > 0 ? (
                sortedSchedules.map((s) => {
                  const isCancelled = s.status === "CANCELLED";
                  return (
                    <tr
                      key={s.scheduleId}
                      onClick={() => !isCancelled && handleEdit(s)}
                      className={`hover:bg-cp-bg/50 transition cursor-pointer ${isCancelled ? "bg-cp-card/70" : "bg-cp-card/30"}`}
                    >
                      <td className="p-4 text-cp-text font-medium">
                        {s.targetType === "GROUP"
                          ? `${s.targetGroupName ?? "이름 없음"}`
                          : s.careTargetName}
                      </td>
                      <td className="p-4 text-cp-muted">
                        {s.nextRunAt || s.scheduledTime}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-cp-input text-cp-text text-xs rounded-sm border border-cp-border">
                          {s.typeLabel || s.type}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-4 py-1.5 text-sm font-bold rounded-sm border shadow-sm ${
                            s.status === "CANCELLED"
                              ? "bg-cp-muted text-white"
                              : getPriorityStyle(s.priority)
                          }`}
                        >
                          {s.priorityLabel || s.priority}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`${s.status === "CANCELLED" ? "text-cp-muted" : "text-emerald-400"}`}
                        >
                          ● {s.statusLabel || s.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-cp-text max-w-[200px] truncate">
                        {s.memo || "-"}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-1.5">
                          {isCancelled ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRestore(s.scheduleId); }}
                              className="text-emerald-400 hover:text-emerald-300 underline text-sm font-bold px-2 py-1 transition-colors"
                            >
                              복구
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEdit(s); }}
                                className="cp-link-blue"
                              >
                                수정
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(s.scheduleId); }}
                                className="cp-link-red"
                              >
                                삭제
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-cp-muted">
                    예정된 일정이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ScheduleModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSaveSuccess={fetchSchedules}
        organizationId={organizationId}
        editingSchedule={editingSchedule}
        viewOnly={scheduleViewOnly}
        onSwitchToEdit={handleSwitchToEdit}
      />
    </>
  );
};

export default CallScheduleTab;
