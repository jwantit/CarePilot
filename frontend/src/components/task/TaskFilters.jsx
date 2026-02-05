import React from "react";
import {
  TASK_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  TASK_TYPE_OPTIONS,
} from "../../utils/taskLabel";
import { Filter, Plus } from "lucide-react";

const inputClass =
  "rounded-sm border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all";
const labelClass = "text-xs font-semibold text-slate-400 uppercase tracking-wider";

const TaskFilters = ({ filters, updateFilter, staffList, onAddClick }) => {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-5 mb-6 shadow-lg">
      <div className="flex flex-wrap items-end justify-between gap-4">
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
            {TASK_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value} className="bg-slate-900">
                {opt.label}
              </option>
            ))}
          </select>

          <span className={labelClass}>우선순위</span>
          <select
            value={filters.priority ?? ""}
            onChange={(e) => updateFilter("priority", e.target.value)}
            className={inputClass}
          >
            {PRIORITY_OPTIONS.map((opt) => (
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
            {TASK_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value} className="bg-slate-900">
                {opt.label}
              </option>
            ))}
          </select>

          <span className={labelClass}>할당자</span>
          <select
            value={filters.assignedToUserId ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              updateFilter("assignedToUserId", v === "" ? null : Number(v));
            }}
            className={inputClass}
          >
            <option value="" className="bg-slate-900">전체</option>
            {Array.isArray(staffList) &&
              staffList.map((s) => (
                <option key={s.userId} value={s.userId} className="bg-slate-900">
                  {s.name ?? s.email ?? s.userId}
                </option>
              ))}
          </select>
        </div>
        {onAddClick && (
          <button
            type="button"
            onClick={onAddClick}
            className="flex items-center gap-2 bg-gradient-to-br from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 text-teal-400 px-5 py-2.5 font-semibold transition-all border border-teal-500/50 hover:border-teal-500 whitespace-nowrap text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <Plus size={18} />
            작업 추가
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskFilters;
