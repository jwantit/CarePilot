import React from "react";
import { getAITaskTypeLabel, getAITaskStatusLabel } from "../../utils/taskLabel";

const getAITaskStatusStyle = (status) => {
  switch (status) {
    case "WAITING":
      return "bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 text-yellow-400 border border-yellow-500/50";
    case "SUCCESS":
      return "bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 text-emerald-400 border border-emerald-500/50";
    case "FAILED":
      return "bg-gradient-to-br from-red-500/20 to-red-600/20 text-red-400 border border-red-500/50";
    default:
      return "bg-gradient-to-br from-slate-500/20 to-slate-600/20 text-slate-400 border border-slate-500/50";
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
      <div className="bg-slate-800 border border-slate-700 p-12 text-center rounded-sm">
        <p className="text-slate-400 text-sm">AI 처리 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-slate-900 border-b-2 border-teal-500/30">
            <tr>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-teal-400 uppercase tracking-wider w-[15%]">
                유형
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-teal-400 uppercase tracking-wider w-[10%]">
                상태
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-teal-400 uppercase tracking-wider w-[12%]">
                케어대상
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-teal-400 uppercase tracking-wider w-[20%]">
                결과 요약
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-teal-400 uppercase tracking-wider w-[15%]">
                시작 시각
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-teal-400 uppercase tracking-wider w-[15%]">
                완료 시각
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-teal-400 uppercase tracking-wider w-[8%]">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {aiTaskList.map((row) => (
              <tr
                key={row.taskId}
                className="bg-slate-800/30 hover:bg-slate-700/50 transition-colors"
              >
                <td className="px-4 py-3 text-slate-300">
                  {getAITaskTypeLabel(row.type)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${getAITaskStatusStyle(
                      row.status
                    )}`}
                  >
                    {getAITaskStatusLabel(row.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 truncate">
                  {row.careTargetName || "-"}
                </td>
                <td className="px-4 py-3 text-slate-400 truncate" title={row.resultSummary}>
                  {row.resultSummary || "-"}
                </td>
                <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                  {formatDateTime(row.startedAt)}
                </td>
                <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                  {formatDateTime(row.completedAt)}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onDetail && onDetail(row.taskId)}
                    className="px-3 py-1 rounded-sm bg-gradient-to-br from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 text-teal-400 text-xs font-semibold border border-teal-500/50 hover:border-teal-500 transition-all"
                  >
                    상세
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AITaskTable;
