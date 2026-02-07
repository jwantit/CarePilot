import React from "react";
import {
  getPriorityLabel,
  getTaskTypeLabel,
  getTaskStatusLabel,
} from "../../utils/taskLabel";
import { AlertCircle, Calendar, User, Tag, Activity, CheckSquare, Edit, FileText, Play } from "lucide-react";

const getPriorityStyle = (priority) => {
  switch (priority) {
    case "URGENT": return "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/50";
    case "HIGH": return "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/50";
    case "MEDIUM": return "bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/50";
    case "LOW":
    default: return "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/50";
  }
};
const getTaskStatusStyle = (status) => {
  switch (status) {
    case "WAITING": return "bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/50";
    case "PROGRESS": return "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/50";
    case "DONE": return "bg-cp-bg text-cp-muted border-cp-border/50 dark:bg-cp-bg/50 dark:text-cp-muted dark:border-cp-border/50";
    default: return "bg-cp-bg text-cp-muted border-cp-border/50 dark:bg-cp-bg/50 dark:text-cp-muted dark:border-cp-border/50";
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return dateString;
  }
};

const TaskTable = ({
  taskList,
  onStart,
  onComplete,
  onEdit,
  onDetail,
  onAssignChange,
  staffList,
}) => {
  if (!taskList || taskList.length === 0) {
    return (
      <div className="bg-cp-card border border-cp-border p-12 text-center">
        <p className="text-cp-muted text-sm">등록된 작업이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-cp-card border border-cp-border overflow-hidden shadow-xl">
      {/* 테이블 헤더 - CareTarget 스타일 동일 적용 (8열) */}
      <div className="grid grid-cols-8 bg-cp-header border-b-2 border-teal-500/30 py-3.5 px-4 text-sm font-semibold text-white dark:text-cp-text text-center items-center min-h-[48px]">
        <div className="text-white dark:text-teal-400">우선순위</div>
        <div className="text-white dark:text-teal-400">제목</div>
        <div className="text-white dark:text-teal-400">케어 대상</div>
        <div className="text-white dark:text-teal-400">유형</div>
        <div className="text-white dark:text-teal-400">할당자</div>
        <div className="text-white dark:text-teal-400">마감일</div>
        <div className="text-white dark:text-teal-400">상태</div>
        <div className="text-white dark:text-teal-400">관리</div>
      </div>

      {/* 데이터 행 */}
      <div className="">
        {taskList.map((task) => (
          <div
            key={task.taskId}
            onClick={() => onDetail && onDetail(task)}
            className="grid grid-cols-8 py-3 px-4 text-sm text-center items-center min-h-[60px] bg-cp-card/30 hover:bg-cp-bg/50 transition border-b border-cp-border cursor-pointer group"
          >
            {/* 우선순위 */}
            <div className="flex items-center justify-center h-full">
              <span
                className={`inline-block px-4 py-1.5 rounded-sm text-sm font-bold border shadow-sm ${getPriorityStyle(
                  task.priority
                )}`}
              >
                {getPriorityLabel(task.priority)}
              </span>
            </div>

            {/* 제목 */}
            <div className="flex items-center justify-center h-full px-2 overflow-hidden">
              <span className="text-cp-text text-base truncate w-full" title={task.title}>
                {task.title || '-'}
              </span>
            </div>

            {/* 케어 대상 */}
            <div className="flex items-center justify-center h-full">
              <span className="text-cp-text text-base truncate w-full">
                {task.careTargetName || '-'}
              </span>
            </div>

            {/* 유형 */}
            <div className="flex items-center justify-center h-full">
              <span className="text-cp-text text-base">
                {getTaskTypeLabel(task.type)}
              </span>
            </div>

            {/* 할당자 Select */}
            <div className="flex items-center justify-center h-full px-2">
              <select
                value={task.assignedToUserId ?? ''}
                onChange={(e) => {
                  e.stopPropagation();
                  const v = e.target.value;
                  onAssignChange &&
                    onAssignChange(task.taskId, v === '' ? null : Number(v));
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-cp-input border border-cp-border rounded-sm px-2 py-1.5 w-full max-w-[120px] text-base text-cp-text focus:ring-1 focus:ring-teal-500 outline-none cursor-pointer"
              >
                <option value="">미할당</option>
                {Array.isArray(staffList) &&
                  staffList.map((s) => (
                    <option key={s.userId} value={s.userId}>
                      {s.name ?? s.email}
                    </option>
                  ))}
              </select>
            </div>

            {/* 마감일 */}
            <div className="flex items-center justify-center h-full">
              <span className="text-cp-text text-base font-mono">
                {formatDate(task.dueDate)}
              </span>
            </div>

            {/* 상태 */}
            <div className="flex items-center justify-center h-full">
              <span
                className={`inline-block px-4 py-1.5 rounded-sm text-sm font-bold border shadow-sm ${getTaskStatusStyle(
                  task.status
                )}`}
              >
                {getTaskStatusLabel(task.status)}
              </span>
            </div>

            {/* 관리 버튼 그룹 */}
            <div className="flex items-center justify-center h-full gap-1.5">
              {task.status === 'WAITING' && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onStart && onStart(task); }}
                  className="cp-link-blue"
                >
                  시작
                </button>
              )}
              {task.status === 'PROGRESS' && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onComplete && onComplete(task.taskId); }}
                  className="cp-link-blue"
                >
                  완료
                </button>
              )}
              {task.status !== 'DONE' && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEdit && onEdit(task); }}
                  className="cp-link-blue"
                >
                  수정
                </button>
              )}
              {task.status === 'DONE' && <span className="text-cp-muted text-xs">-</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskTable;
