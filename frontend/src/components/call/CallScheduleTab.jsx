import React, { useEffect, useMemo, useState } from "react";
import { getUpcomingSchedules, deleteSchedule, restoreSchedule } from "../../api/callApi";
import ScheduleModal from "./ScheduleModal"; // 모달 임포트

const CallScheduleTab = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [sortCriterion, setSortCriterion] = useState("TIME");
  const [expandedDay, setExpandedDay] = useState(null); // 확장된 날짜 상태

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const data = await getUpcomingSchedules();
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

    try {
      await deleteSchedule(scheduleId);
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

    try {
      await restoreSchedule(scheduleId);
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
  };

  const formatYMD = (date) => date.toISOString().slice(0, 10);

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

  const monthLabel = `${calendarDate.getFullYear()}년 ${calendarDate.toLocaleString("ko-KR", {
    month: "long",
  })}`;

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
        if (!a.scheduledTime || !b.scheduledTime) return 0;
        const aTime = new Date(a.scheduledTime.replace(" ", "T")).getTime();
        const bTime = new Date(b.scheduledTime.replace(" ", "T")).getTime();
        return aTime - bTime;
      });
    }
    
    // 취소된 항목도 시간순으로 정렬
    cancelledRows.sort((a, b) => {
      if (!a.scheduledTime || !b.scheduledTime) return 0;
      const aTime = new Date(a.scheduledTime.replace(" ", "T")).getTime();
      const bTime = new Date(b.scheduledTime.replace(" ", "T")).getTime();
      return aTime - bTime;
    });
    
    // 활성 항목 먼저, 취소된 항목은 아래로
    return [...activeRows, ...cancelledRows];
  }, [schedules, sortCriterion]);

  const scheduleByDay = useMemo(() => {
    const map = {};
    sortedSchedules.forEach((schedule) => {
      if (!schedule.scheduledTime) return;
      const key = schedule.scheduledTime.split(" ")[0];
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(schedule);
    });
    return map;
  }, [sortedSchedules]);

  const scheduleDays = useMemo(() => new Set(Object.keys(scheduleByDay)), [scheduleByDay]);

  return (
    <div className="space-y-4">
      <div className="rounded border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">2026년 01월 캘린더</p>
            <h3 className="text-lg font-semibold">{monthLabel}</h3>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              className="rounded border border-[#008080] px-2 py-1 text-[#008080] hover:bg-[#008080] hover:text-white transition"
              onClick={() => moveMonth(-1)}
            >
              이전
            </button>
            <button
              type="button"
              className="rounded border border-[#008080] px-2 py-1 text-[#008080] hover:bg-[#008080] hover:text-white transition"
              onClick={() => moveMonth(1)}
            >
              다음
            </button>
            <button
              type="button"
              className="rounded border border-[#008080] bg-[#008080] px-3 py-1 text-white hover:bg-[#006666] transition"
              onClick={goToToday}
            >
              오늘
            </button>
          </div>
        </div>
        <div className="mb-2 grid grid-cols-7 gap-2 text-xs font-semibold uppercase text-gray-400">
          {["일", "월", "화", "수", "목", "금", "토"].map((label) => (
            <div key={label} className="py-1 text-center">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 text-sm">
          {calendarCells.map((cell, index) => {
            const isToday = cell.date ? isSameDay(cell.date, new Date()) : false;
            const isSelected = cell.date ? isSameDay(cell.date, selectedDate) : false;
            const dayKey = cell.date ? formatYMD(cell.date) : null;
            const dayEvents = dayKey ? scheduleByDay[dayKey] || [] : [];
            const hasSchedule = dayEvents.length > 0;
            const isExpanded = expandedDay === dayKey;
            const maxVisible = isExpanded ? dayEvents.length : 2;
            const visibleEvents = dayEvents.slice(0, maxVisible);
            const hasMore = dayEvents.length > maxVisible;

            const baseClasses =
              "flex h-24 flex-col items-start justify-start rounded border px-2 py-1 transition relative overflow-hidden";
            const bgClass = cell.date ? "bg-white" : "bg-gray-50";
            const borderClass = hasSchedule ? "border-[#008080]/30" : "border-gray-200";
            const selectedClass = isSelected ? "border-[#008080] bg-[#008080]/10" : "";
            const todayClass = isToday ? "ring-2 ring-[#008080]" : "";

            return (
              <div
                key={`cell-${index}`}
                role={cell.date ? "button" : undefined}
                tabIndex={cell.date ? 0 : -1}
                className={`${baseClasses} ${bgClass} ${borderClass} ${selectedClass} ${todayClass} ${cell.date ? "cursor-pointer" : "cursor-not-allowed"}`}
                onClick={() => cell.date && setSelectedDate(cell.date)}
                onKeyDown={(e) => {
                  if (cell.date && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    setSelectedDate(cell.date);
                  }
                }}
              >
                <span className="text-sm font-semibold text-gray-700 mb-1">
                  {cell.dayNumber ?? ""}
                </span>
                <div className="flex flex-col gap-1 w-full overflow-y-auto">
                  {visibleEvents.map((event) => {
                    const isCancelled = event.status === "CANCELLED";
                    const targetName = event.careTargetName || event.targetGroupName || "대상";
                    const eventText = `${targetName} · ${event.scheduledTime.slice(-5)}`;
                    const fullText = event.memo
                      ? `${eventText} - ${event.memo}`
                      : eventText;

                    // 우선순위별 배경색 결정
                    let bgColor = "bg-gray-500";
                    if (isCancelled) {
                      bgColor = "bg-gray-400";
                    } else if (event.priority === "URGENT") {
                      bgColor = "bg-red-500";
                    } else if (event.priority === "HIGH") {
                      bgColor = "bg-orange-500";
                    } else if (event.priority === "MEDIUM") {
                      bgColor = "bg-blue-500";
                    } else if (event.priority === "LOW") {
                      bgColor = "bg-gray-500";
                    }

                    return (
                      <div
                        key={event.scheduleId}
                        className={`text-[10px] px-1.5 py-0.5 rounded text-white truncate cursor-pointer hover:opacity-90 transition ${bgColor}`}
                        title={fullText}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(event);
                        }}
                      >
                        {eventText}
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
                      className="text-[9px] text-[#008080] hover:text-[#006666] font-medium px-1 py-0.5 rounded hover:bg-[#008080]/10 transition"
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

      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border">
        <div>
          <h2 className="text-lg font-bold">통화 예정 일정</h2>
          <p className="text-sm text-gray-500">
            AI가 자동으로 전화를 걸거나 상담원 연결이 예정된 목록입니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded bg-white px-2 py-1 shadow-sm">
            <button
              type="button"
              className={`h-8 rounded px-3 text-xs font-medium transition ${
                sortCriterion === "TIME"
                  ? "bg-[#008080] text-white"
                  : "bg-transparent text-gray-600 hover:text-[#008080]"
              }`}
              onClick={() => setSortCriterion("TIME")}
            >
              시간순
            </button>
            <button
              type="button"
              className={`h-8 rounded px-3 text-xs font-medium transition ${
                sortCriterion === "PRIORITY"
                  ? "bg-[#008080] text-white"
                  : "bg-transparent text-gray-600 hover:text-[#008080]"
              }`}
              onClick={() => setSortCriterion("PRIORITY")}
            >
              우선순위순
            </button>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#008080] text-white px-4 py-2 rounded-md hover:bg-[#006666] transition"
          >
            + 일정 추가
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-sm">
            <tr>
              <th className="p-3">대상자</th>
              <th className="p-3">예정 시간</th>
              <th className="p-3">유형</th>
              <th className="p-3">우선순위</th>
              <th className="p-3">상태</th>
              <th className="p-3">메모</th>
              <th className="p-3">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-10 text-center">
                  데이터 로딩 중...
                </td>
              </tr>
            ) : sortedSchedules.length > 0 ? (
              sortedSchedules.map((s) => {
                const isCancelled = s.status === "CANCELLED";
                return (
                  <tr
                    key={s.scheduleId}
                    className={`hover:bg-gray-50 transition ${isCancelled ? "bg-gray-100/70" : ""}`}
                  >
                    <td className="p-3 font-medium">
                      {s.targetType === "GROUP"
                        ? `그룹: ${s.targetGroupName ?? "이름 없음"}`
                        : s.careTargetName}
                    </td>
                    <td className="p-3 text-gray-600">{s.scheduledTime}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-gray-200 text-xs rounded-full">
                        {s.typeLabel || s.type}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${
                          s.status === "CANCELLED"
                            ? "bg-gray-400"
                            : s.priority === "URGENT"
                            ? "bg-red-500"
                            : s.priority === "HIGH"
                            ? "bg-orange-500"
                            : s.priority === "MEDIUM"
                            ? "bg-blue-500"
                            : "bg-gray-500"
                        }`}
                      >
                        {s.priorityLabel || s.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`${s.status === "CANCELLED" ? "text-gray-500" : "text-green-600"}`}>
                        ● {s.statusLabel || s.status}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-700">
                      {s.memo || "-"}
                    </td>
                    <td className="p-3">
                      {isCancelled ? (
                        <button
                          onClick={() => handleRestore(s.scheduleId)}
                          className="text-[#008080] hover:text-[#006666] underline text-sm font-medium"
                        >
                          복구
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(s)}
                            className="text-[#008080] hover:text-[#006666] underline text-sm font-medium"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(s.scheduleId)}
                            className="text-red-600 hover:text-red-800 underline text-sm font-medium"
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="p-10 text-center text-gray-400">
                  예정된 일정이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ScheduleModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSaveSuccess={fetchSchedules} // 저장 성공 시 목록 갱신
        organizationId={1} // 현재 접속자의 조직 ID
        editingSchedule={editingSchedule}
      />
    </div>
  );
};

export default CallScheduleTab;
