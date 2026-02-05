import React from "react";
import { AI_TASK_STATUS_OPTIONS, AI_TASK_TYPE_OPTIONS } from "../../utils/taskLabel";
import { Filter } from "lucide-react";

const inputClass =
  "rounded-sm border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all";
const labelClass = "text-xs font-semibold text-slate-400 uppercase tracking-wider";

const AITaskFilters = ({ filters, updateFilter }) => {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-5 mb-6 shadow-lg">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-teal-400" />
          <span className={labelClass}>상태</span>
        </div>
        <select
          value={filters.status ?? ""}
          onChange={(e) => updateFilter("status", e.target.value)}
          className={inputClass}
        >
          {AI_TASK_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value} className="bg-slate-900">
              {opt.label}
            </option>
          ))}
        </select>

        <span className={labelClass}>유형</span>
        <select
          value={filters.type ?? ""}
          onChange={(e) => updateFilter("type", e.target.value)}
          className={inputClass}
        >
          {AI_TASK_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value} className="bg-slate-900">
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default AITaskFilters;
