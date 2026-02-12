import React from "react";
import {
  getTaskStatusLabel,
  getTaskStatusColor,
  getPriorityLabel,
  getPriorityColor,
  getTaskTypeLabel,
} from "../../utils/taskLabel";

const TaskRow = ({
  task,
  onDetail,
  onAssignChange,
  staffList,
  onStart,
  onComplete,
  onEdit,
}) => {
  return (
    <div
      onClick={() => onDetail && onDetail(task)}
      className="grid grid-cols-8 py-3 px-4 text-sm text-center items-center min-h-[60px] bg-cp-card/30 hover:bg-cp-bg/50 transition border-b border-cp-border cursor-pointer group"
    >
      {/* 우선순위 */}
      <div className="flex items-center justify-center">
        <span
          className={`inline-block px-3 py-1 rounded-sm text-xs font-bold border ${getPriorityColor(
            task.priority,
          )} shadow-sm`}
        >
          {getPriorityLabel(task.priority)}
        </span>
      </div>

      {/* 제목 */}
      <div className="flex items-center justify-center overflow-hidden">
        <span className="text-cp-text text-base font-medium truncate w-full px-2">
          {task.title}
        </span>
      </div>

      {/* 케어 대상 */}
      <div className="flex items-center justify-center">
        <span className="text-cp-text text-base">
          {task.careTargetName || "-"}
        </span>
      </div>

      {/* 유형 */}
      <div className="flex items-center justify-center">
        <span className="text-cp-muted text-sm">
          {getTaskTypeLabel(task.type)}
        </span>
      </div>

      {/* 할당자 */}
      <div
        className="flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <select
          value={task.assignedToUserId || ""}
          onChange={(e) =>
            onAssignChange(
              task.taskId,
              e.target.value ? Number(e.target.value) : null,
            )
          }
          className="bg-cp-bg border border-cp-border text-cp-text text-sm rounded-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="">미지정</option>
          {staffList.map((staff) => (
            <option key={staff.userId} value={staff.userId}>
              {staff.name}
            </option>
          ))}
        </select>
      </div>

      {/* 마감일 */}
      <div className="flex items-center justify-center">
        <span className="text-cp-text text-base font-mono">
          {task.dueDate ? task.dueDate.split("T")[0] : "-"}
        </span>
      </div>

      {/* 상태 */}
      <div className="flex items-center justify-center">
        <span
          className={`inline-block px-3 py-1 rounded-sm text-xs font-bold border ${getTaskStatusColor(
            task.status,
          )} shadow-sm`}
        >
          {getTaskStatusLabel(task.status)}
        </span>
      </div>

      {/* 관리 버튼 */}
      <div
        className="flex items-center justify-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {task.status === "WAITING" && (
          <button
            onClick={() => onStart(task)}
            className="px-2 py-1 bg-teal-600/20 text-teal-400 border border-teal-500/50 rounded-sm text-xs hover:bg-teal-600/40 transition"
          >
            시작
          </button>
        )}
        {task.status === "PROGRESS" && (
          <button
            onClick={() => onComplete(task.taskId)}
            className="px-2 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 rounded-sm text-xs hover:bg-emerald-600/40 transition"
          >
            완료
          </button>
        )}
        <button
          onClick={() => onEdit(task)}
          className="px-2 py-1 bg-cp-bg text-cp-muted border border-cp-border rounded-sm text-xs hover:text-cp-text transition"
        >
          수정
        </button>
      </div>
    </div>
  );
};

export default TaskRow;
