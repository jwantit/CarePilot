import React from "react";
import {
  getPriorityLabel,
  getTaskTypeLabel,
  getTaskStatusLabel,
} from "../../utils/taskLabel";
import { AlertCircle, Calendar, User, Tag, Activity, CheckSquare, Edit, FileText, Play } from "lucide-react";

const getPriorityStyle = (priority) => {
  switch (priority) {
    case "URGENT": return "bg-gradient-to-br from-red-500/20 to-red-600/20 text-red-400 border border-red-500/50";
    case "HIGH": return "bg-gradient-to-br from-orange-500/20 to-orange-600/20 text-orange-400 border border-orange-500/50";
    case "MEDIUM": return "bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 text-yellow-400 border border-yellow-500/50";
    case "LOW":
    default: return "bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 text-emerald-400 border border-emerald-500/50";
  }
};
const getTaskStatusStyle = (status) => {
  switch (status) {
    case "WAITING": return "bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 text-yellow-400 border border-yellow-500/50";
    case "PROGRESS": return "bg-gradient-to-br from-blue-500/20 to-blue-600/20 text-blue-400 border border-blue-500/50";
    case "DONE": return "bg-cp-bg/50 text-cp-muted border border-cp-border/50";
    default: return "bg-cp-bg/50 text-cp-muted border border-cp-border/50";
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
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-sm">
          {/* 테이블 헤더 - CareTarget 스타일 적용 */}
          <thead className="bg-cp-header border-b-2 border-teal-500/30">
            <tr>
              <th className="px-4 py-3.5 text-center text-xs font-semibold text-teal-400 uppercase tracking-wider w-[10%]">
                <div className="flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>우선순위</span>
                </div>
              </th>
              <th className="px-4 py-3.5 text-center text-xs font-semibold text-teal-400 uppercase tracking-wider w-[20%]">
                <div className="flex items-center justify-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  <span>제목</span>
                </div>
              </th>
              <th className="px-4 py-3.5 text-center text-xs font-semibold text-teal-400 uppercase tracking-wider w-[12%]">
                <div className="flex items-center justify-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  <span>케어 대상</span>
                </div>
              </th>
              <th className="px-4 py-3.5 text-center text-xs font-semibold text-teal-400 uppercase tracking-wider w-[12%]">
                <div className="flex items-center justify-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  <span>유형</span>
                </div>
              </th>
              <th className="px-4 py-3.5 text-center text-xs font-semibold text-teal-400 uppercase tracking-wider w-[12%]">
                <div className="flex items-center justify-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  <span>할당자</span>
                </div>
              </th>
              <th className="px-4 py-3.5 text-center text-xs font-semibold text-teal-400 uppercase tracking-wider w-[10%]">
                <div className="flex items-center justify-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>마감일</span>
                </div>
              </th>
              <th className="px-4 py-3.5 text-center text-xs font-semibold text-teal-400 uppercase tracking-wider w-[8%]">
                상태
              </th>
              <th className="px-4 py-3.5 text-center text-xs font-semibold text-teal-400 uppercase tracking-wider w-[16%]">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cp-border/50">
            {taskList.map((task) => (
              <tr key={task.taskId} className="hover:bg-cp-bg/30 transition-colors">
                {/* 우선순위 */}
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${getPriorityStyle(
                      task.priority
                    )}`}
                  >
                    {getPriorityLabel(task.priority)}
                  </span>
                </td>
                {/* 제목 */}
                <td className="px-4 py-3">
                  <div className="text-cp-text font-medium truncate pl-2" title={task.title}>
                    {task.title || '-'}
                  </div>
                </td>
                {/* 케어 대상 */}
                <td className="px-4 py-3 text-center text-cp-muted truncate">
                  {task.careTargetName || '-'}
                </td>
                {/* 유형 */}
                <td className="px-4 py-3 text-center text-cp-muted">
                  {getTaskTypeLabel(task.type)}
                </td>
                {/* 할당자 Select */}
                <td className="px-4 py-3 text-center">
                  <select
                    value={task.assignedToUserId ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      onAssignChange &&
                        onAssignChange(task.taskId, v === '' ? null : Number(v));
                    }}
                    className="bg-cp-input border border-cp-border text-cp-text text-xs rounded px-2 py-1 w-full max-w-[120px] focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
                  >
                    <option value="">미할당</option>
                    {Array.isArray(staffList) &&
                      staffList.map((s) => (
                        <option key={s.userId} value={s.userId}>
                          {s.name ?? s.email}
                        </option>
                      ))}
                  </select>
                </td>
                {/* 마감일 */}
                <td className="px-4 py-3 text-center text-cp-muted whitespace-nowrap text-xs">
                  {formatDate(task.dueDate)}
                </td>
                {/* 상태 */}
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${getTaskStatusStyle(
                      task.status
                    )}`}
                  >
                    {getTaskStatusLabel(task.status)}
                  </span>
                </td>
                {/* 관리 버튼 그룹 */}
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-3">
                    {task.status === 'WAITING' && (
                      <button
                        type="button"
                        onClick={() => onStart && onStart(task)}
                        className="cp-link-blue"
                      >
                        시작
                      </button>
                    )}
                    {task.status === 'PROGRESS' && (
                      <button
                        type="button"
                        onClick={() => onComplete && onComplete(task.taskId)}
                        className="cp-link-blue"
                      >
                        완료
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDetail && onDetail(task)}
                      className="cp-link-muted"
                    >
                      상세
                    </button>
                    {task.status !== 'DONE' && (
                      <button
                        type="button"
                        onClick={() => onEdit && onEdit(task)}
                        className="cp-link-blue"
                      >
                        수정
                      </button>
                    )}
                    {task.status === 'DONE' && <span className="text-cp-muted text-xs px-2">-</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskTable;
