import React from "react";
import { getAITaskTypeLabel, getAITaskStatusLabel } from "../../utils/taskLabel";

const getAITaskStatusStyle = (status) => {
  switch (status) {
    case "WAITING":
      return "bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/50";
    case "SUCCESS":
      return "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/50";
    case "FAILED":
      return "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/50";
    default:
      return "bg-cp-bg text-cp-muted border-cp-border/50 dark:bg-cp-bg/50 dark:text-cp-muted dark:border-cp-border/50";
  }
};

const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}:${min}`;
  } catch {
    return dateString;
  }
};

const AITaskTable = ({ aiTaskList, onDetail }) => {
  if (!aiTaskList || aiTaskList.length === 0) {
    return (
      <div className="bg-cp-card border border-cp-border p-12 text-center rounded-sm">
        <p className="text-cp-muted text-sm">AI 처리 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-cp-card border border-cp-border rounded-sm overflow-hidden shadow-xl">
      {/* 테이블 헤더 - CareTarget 스타일 동일 적용 (6열) */}
      <div className="grid grid-cols-6 bg-cp-header border-b-2 border-teal-500/30 py-3.5 px-4 text-sm font-semibold text-white dark:text-cp-text text-center items-center min-h-[48px]">
        <div className="text-white dark:text-teal-400">유형</div>
        <div className="text-white dark:text-teal-400">상태</div>
        <div className="text-white dark:text-teal-400">케어대상</div>
        <div className="text-white dark:text-teal-400">결과 요약</div>
        <div className="text-white dark:text-teal-400">시작 시각</div>
        <div className="text-white dark:text-teal-400">완료 시각</div>
      </div>

      {/* 데이터 행 */}
      <div className="">
        {aiTaskList.map((row) => (
          <div
            key={row.taskId}
            onClick={() => onDetail && onDetail(row.taskId)}
            className="grid grid-cols-6 py-3 px-4 text-sm text-center items-center min-h-[60px] bg-cp-card/30 hover:bg-cp-bg/50 transition border-b border-cp-border cursor-pointer group"
          >
            {/* 유형 */}
            <div className="flex items-center justify-center h-full">
              <span className="text-cp-text text-base">
                {getAITaskTypeLabel(row.type)}
              </span>
            </div>

            {/* 상태 */}
            <div className="flex items-center justify-center h-full">
              <span
                className={`inline-block px-4 py-1.5 rounded-sm text-sm font-bold border ${getAITaskStatusStyle(
                  row.status
                )} shadow-sm`}
              >
                {getAITaskStatusLabel(row.status)}
              </span>
            </div>

            {/* 케어대상 */}
            <div className="flex items-center justify-center h-full overflow-hidden">
              <span className="text-cp-text text-base truncate w-full">
                {row.careTargetName || "-"}
              </span>
            </div>

            {/* 결과 요약 */}
            <div className="flex items-center justify-center h-full px-2 overflow-hidden">
              <span className="text-cp-text text-base truncate w-full" title={row.resultSummary}>
                {row.resultSummary || "-"}
              </span>
            </div>

            {/* 시작 시각 */}
            <div className="flex items-center justify-center h-full">
              <span className="text-cp-text text-base font-mono">
                {formatDateTime(row.startedAt)}
              </span>
            </div>

            {/* 완료 시각 */}
            <div className="flex items-center justify-center h-full">
              <span className="text-cp-text text-base font-mono">
                {formatDateTime(row.completedAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AITaskTable;
