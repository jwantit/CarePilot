import React, { useState, useEffect } from "react";
import { X, FileText } from "lucide-react";
import { getTask } from "../../api/task/taskApi";
import {
  getTaskTypeLabel,
  getTaskStatusLabel,
  getPriorityLabel,
} from "../../utils/taskLabel";
import { toast } from "react-hot-toast";
import Loading from "../common/Loading";

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

const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return dateString;
  }
};

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
    case "DONE": return "bg-gradient-to-br from-slate-500/20 to-slate-600/20 text-slate-400 border border-slate-500/50";
    default: return "bg-gradient-to-br from-slate-500/20 to-slate-600/20 text-slate-400 border border-slate-500/50";
  }
};

const TaskDetailModal = ({ open, onClose, taskId, onEdit }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !taskId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getTask(taskId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("상세 정보를 불러오는데 실패했습니다.");
          onClose();
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, taskId, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-sm shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 shrink-0">
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText size={24} className="text-teal-400" />
            작업 상세
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-sm text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loading />
            </div>
          ) : detail ? (
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">제목</dt>
                <dd className="text-slate-200">{detail.title || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">설명</dt>
                <dd className="text-slate-200 mt-1 p-3 bg-slate-900/50 rounded-sm border border-slate-600 whitespace-pre-wrap break-words">
                  {detail.description || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">유형</dt>
                <dd className="text-slate-200">{getTaskTypeLabel(detail.type)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">우선순위</dt>
                <dd>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getPriorityStyle(detail.priority)}`}>
                    {getPriorityLabel(detail.priority)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">상태</dt>
                <dd>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getTaskStatusStyle(detail.status)}`}>
                    {getTaskStatusLabel(detail.status)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">케어대상</dt>
                <dd className="text-slate-200">{detail.careTargetName || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">할당자</dt>
                <dd className="text-slate-200">{detail.assignedToName || "미할당"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">마감일</dt>
                <dd className="text-slate-200">{formatDate(detail.dueDate)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">등록 시각</dt>
                <dd className="text-slate-200">{formatDateTime(detail.createdAt)}</dd>
              </div>
            </dl>
          ) : null}
        </div>

        <div className="p-5 border-t border-slate-700 flex-shrink-0 flex gap-3 justify-end bg-gradient-to-r from-slate-800/80 to-slate-900/80">
          {!loading && detail && detail.status !== "DONE" && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit && onEdit(detail);
              }}
              className="px-4 py-2.5 rounded-sm font-semibold text-sm bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-600 text-slate-300 hover:from-slate-800 hover:to-slate-900 hover:border-slate-500 hover:text-slate-100 transition-all"
            >
              수정
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-sm font-semibold text-sm bg-gradient-to-br from-teal-600 to-teal-700 border border-teal-500 text-white hover:from-teal-500 hover:to-teal-600 transition-all"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
