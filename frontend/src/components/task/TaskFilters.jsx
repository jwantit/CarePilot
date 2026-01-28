import React from 'react';
import {
  TASK_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  TASK_TYPE_OPTIONS,
} from '../../utils/taskLabel';

const TaskFilters = ({ filters, updateFilter, staffList }) => {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <span className="text-sm font-medium text-gray-700">상태</span>
      <select
        value={filters.status ?? ''}
        onChange={(e) => updateFilter('status', e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#008080] focus:border-[#008080] outline-none"
      >
        {TASK_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value || 'all'} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <span className="text-sm font-medium text-gray-700 ml-2">우선순위</span>
      <select
        value={filters.priority ?? ''}
        onChange={(e) => updateFilter('priority', e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#008080] focus:border-[#008080] outline-none"
      >
        {PRIORITY_OPTIONS.map((opt) => (
          <option key={opt.value || 'all'} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <span className="text-sm font-medium text-gray-700 ml-2">유형</span>
      <select
        value={filters.type ?? ''}
        onChange={(e) => updateFilter('type', e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#008080] focus:border-[#008080] outline-none"
      >
        {TASK_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value || 'all'} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <span className="text-sm font-medium text-gray-700 ml-2">할당자</span>
      <select
        value={filters.assignedToUserId ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          updateFilter('assignedToUserId', v === '' ? null : Number(v));
        }}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#008080] focus:border-[#008080] outline-none"
      >
        <option value="">전체</option>
        {Array.isArray(staffList) &&
          staffList.map((s) => (
            <option key={s.userId} value={s.userId}>
              {s.name ?? s.email ?? s.userId}
            </option>
          ))}
      </select>
    </div>
  );
};

export default TaskFilters;
