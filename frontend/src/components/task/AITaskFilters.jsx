import React from 'react';
import { AI_TASK_STATUS_OPTIONS, AI_TASK_TYPE_OPTIONS } from '../../utils/taskLabel';

const AITaskFilters = ({ filters, updateFilter }) => {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <span className="text-sm font-medium text-gray-700">상태</span>
      <select
        value={filters.status ?? ''}
        onChange={(e) => updateFilter('status', e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#008080] focus:border-[#008080] outline-none"
      >
        {AI_TASK_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value || 'all'} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <span className="text-sm font-medium text-gray-700 ml-2">유형</span>
      <select
        value={filters.taskType ?? ''}
        onChange={(e) => updateFilter('taskType', e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#008080] focus:border-[#008080] outline-none"
      >
        {AI_TASK_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value || 'all'} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default AITaskFilters;
