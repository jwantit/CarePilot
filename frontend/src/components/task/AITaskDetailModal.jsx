import React, { useState, useEffect } from 'react';
import { getAITask } from '../../api/task/aiTaskApi';
import {
  getAITaskTypeLabel,
  getAITaskStatusLabel,
  getAITaskStatusColor,
} from '../../utils/taskLabel';
import { toast } from 'react-hot-toast';

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${h}:${min}`;
  } catch {
    return dateString;
  }
};

const AITaskDetailModal = ({ open, onClose, aiTaskId }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !aiTaskId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getAITask(aiTaskId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('상세 정보를 불러오는데 실패했습니다.');
          onClose();
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, aiTaskId, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden />
        <div className="relative bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-bold text-gray-900">AI 처리 내역 상세</h2>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            {loading && (
              <div className="py-8 text-center text-gray-500">불러오는 중...</div>
            )}
            {!loading && detail && (
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase mb-0.5">유형</dt>
                  <dd className="text-gray-900">{getAITaskTypeLabel(detail.taskType)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase mb-0.5">상태</dt>
                  <dd>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getAITaskStatusColor(
                        detail.status
                      )}`}
                    >
                      {getAITaskStatusLabel(detail.status)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase mb-0.5">케어대상</dt>
                  <dd className="text-gray-900">{detail.careTargetName || '-'}</dd>
                </div>
                {(detail.callId != null || detail.scheduleId != null || detail.notificationId != null || detail.taskId != null || detail.groupId != null) && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase mb-0.5">연결 ID</dt>
                    <dd className="text-gray-600">
                      {detail.callId != null && `통화 ${detail.callId} `}
                      {detail.scheduleId != null && `스케줄 ${detail.scheduleId} `}
                      {detail.notificationId != null && `알림 ${detail.notificationId} `}
                      {detail.taskId != null && `작업 ${detail.taskId} `}
                      {detail.groupId != null && `그룹 ${detail.groupId}`}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase mb-0.5">시작 시각</dt>
                  <dd className="text-gray-900">{formatDateTime(detail.startedAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase mb-0.5">완료 시각</dt>
                  <dd className="text-gray-900">{formatDateTime(detail.completedAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase mb-0.5">등록 시각</dt>
                  <dd className="text-gray-900">{formatDateTime(detail.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase mb-0.5">수정 시각</dt>
                  <dd className="text-gray-900">{formatDateTime(detail.updatedAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase mb-0.5">처리 결과</dt>
                  <dd className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap break-words">
                    {detail.result || '-'}
                  </dd>
                </div>
              </dl>
            )}
          </div>
          <div className="p-6 border-t border-gray-200 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-[#008080] rounded-lg hover:bg-[#006666]"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITaskDetailModal;
