import React from "react";
import { AI_TASK_STATUS_OPTIONS, AI_TASK_TYPE_OPTIONS } from "../../utils/taskLabel";
import { Filter } from "lucide-react";

const inputClass =
  "rounded-sm border border-cp-border bg-cp-input px-3 py-2 text-sm text-cp-text focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all";
const labelClass = "text-xs font-semibold text-cp-muted uppercase tracking-wider";

const AITaskFilters = ({ filters, updateFilter }) => {
  return (
    <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border p-5 mb-6 shadow-lg rounded-sm">
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
            <option key={opt.value || "all"} value={opt.value} className="bg-cp-bg">
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
            <option key={opt.value || "all"} value={opt.value} className="bg-cp-bg">
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default AITaskFilters;
