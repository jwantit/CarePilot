import React from 'react';
import {
  getPriorityLabel,
  getPriorityColor,
  getTaskTypeLabel,
  getTaskStatusLabel,
  getTaskStatusColor,
} from '../../utils/taskLabel';

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
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <p className="text-gray-500 text-sm">등록된 작업이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[10%]">
                우선순위
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[20%]">
                제목
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[12%]">
                환자
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[12%]">
                유형
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[12%]">
                할당자
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[10%]">
                마감일
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[8%]">
                상태
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-[16%]">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {taskList.map((task) => (
              <tr key={task.taskId} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(
                      task.priority
                    )}`}
                  >
                    {getPriorityLabel(task.priority)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900 truncate" title={task.title}>
                    {task.title || '-'}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 truncate">
                  {task.careTargetName || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {getTaskTypeLabel(task.type)}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={task.assignedToUserId ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      onAssignChange &&
                        onAssignChange(task.taskId, v === '' ? null : Number(v));
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-sm w-full max-w-[120px] focus:ring-1 focus:ring-[#008080] focus:border-[#008080] outline-none"
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
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {formatDate(task.dueDate)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getTaskStatusColor(
                      task.status
                    )}`}
                  >
                    {getTaskStatusLabel(task.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {task.status === 'WAITING' && (
                      <button
                        type="button"
                        onClick={() => onStart && onStart(task.taskId)}
                        className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        시작
                      </button>
                    )}
                    {task.status === 'PROGRESS' && (
                      <button
                        type="button"
                        onClick={() => onComplete && onComplete(task.taskId)}
                        className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700 hover:bg-green-200"
                      >
                        완료
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDetail && onDetail(task)}
                      className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      상세
                    </button>
                    {task.status !== 'DONE' && (
                      <button
                        type="button"
                        onClick={() => onEdit && onEdit(task)}
                        className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        수정
                      </button>
                    )}
                    {task.status === 'DONE' && <span className="text-gray-400 text-xs">-</span>}
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
