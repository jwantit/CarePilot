import React, { useState, useEffect } from "react";
import { X, Cpu } from "lucide-react";
import { getTask } from "../../api/task/taskApi";
import {
  getAITaskTypeLabel,
  getAITaskStatusLabel,
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

const getAITaskStatusStyle = (status) => {
  switch (status) {
    case "WAITING":
      return "bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 text-yellow-400 border border-yellow-500/50";
    case "SUCCESS":
      return "bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 text-emerald-400 border border-emerald-500/50";
    case "FAILED":
      return "bg-gradient-to-br from-red-500/20 to-red-600/20 text-red-400 border border-red-500/50";
    default:
      return "bg-cp-bg/50 text-cp-muted border border-cp-border/50";
  }
};

const AITaskDetailModal = ({ open, onClose, taskId }) => {
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
      <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-sm shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-cp-border bg-cp-bg/30 shrink-0">
          <h3 className="text-xl font-bold text-cp-text flex items-center gap-2">
            <Cpu size={24} className="text-teal-400" />
            AI 처리 내역 상세
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-sm text-cp-muted hover:bg-cp-bg hover:text-cp-text transition-all"
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
                <dt className="text-xs font-semibold text-cp-muted uppercase tracking-wider mb-0.5">유형</dt>
                <dd className="text-cp-text">{getAITaskTypeLabel(detail.type)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-cp-muted uppercase tracking-wider mb-0.5">상태</dt>
                <dd>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getAITaskStatusStyle(detail.status)}`}>
                    {getAITaskStatusLabel(detail.status)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-cp-muted uppercase tracking-wider mb-0.5">케어대상</dt>
                <dd className="text-cp-text">{detail.careTargetName || "-"}</dd>
              </div>
              {(detail.callId != null || detail.scheduleId != null || detail.notificationId != null || detail.groupId != null) && (
                <div>
                  <dt className="text-xs font-semibold text-cp-muted uppercase tracking-wider mb-0.5">연결 ID</dt>
                  <dd className="text-cp-muted">
                    {detail.callId != null && `통화 ${detail.callId} `}
                    {detail.scheduleId != null && `스케줄 ${detail.scheduleId} `}
                    {detail.notificationId != null && `알림 ${detail.notificationId} `}
                    {detail.groupId != null && `그룹 ${detail.groupId}`}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-semibold text-cp-muted uppercase tracking-wider mb-0.5">시작 시각</dt>
                <dd className="text-cp-text">{formatDateTime(detail.startedAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-cp-muted uppercase tracking-wider mb-0.5">완료 시각</dt>
                <dd className="text-cp-text">{formatDateTime(detail.completedAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-cp-muted uppercase tracking-wider mb-0.5">등록 시각</dt>
                <dd className="text-cp-text">{formatDateTime(detail.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-cp-muted uppercase tracking-wider mb-0.5">수정 시각</dt>
                <dd className="text-cp-text">{formatDateTime(detail.updatedAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-cp-muted uppercase tracking-wider mb-0.5">처리 결과</dt>
                <dd className="text-cp-text mt-1 p-3 bg-cp-input/50 rounded-sm border border-cp-border whitespace-pre-wrap break-words">
                  {detail.result || "-"}
                </dd>
              </div>
            </dl>
          ) : null}
        </div>

        <div className="p-5 border-t border-cp-border flex-shrink-0 bg-cp-bg/30">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-sm font-semibold text-sm bg-gradient-to-br from-teal-600 to-teal-700 border border-teal-500 text-white hover:from-teal-500 hover:to-teal-600 transition-all"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default AITaskDetailModal;
