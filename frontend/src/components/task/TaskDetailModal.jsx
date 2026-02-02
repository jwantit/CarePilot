import React, { useState, useEffect } from 'react';
import { getTask } from '../../api/task/taskApi';
import {
  getTaskTypeLabel,
  getTaskStatusLabel,
  getTaskStatusColor,
  getPriorityLabel,
  getPriorityColor,
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

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return dateString;
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
          toast.error('상세 정보를 불러오는데 실패했습니다.');
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden />
        <div className="relative bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-bold text-gray-900">작업 상세</h2>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            {loading && (
              <div className="py-8 text-center text-gray-500">불러오는 중...</div>
            )}
            {!loading && detail && (
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase mb-0.5">제목</dt>
                  <dd className="text-gray-900">{detail.title || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase mb-0.5">설명</dt>
                  <dd className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap break-words">
                    {detail.description || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase mb-0.5">유형</dt>
                  <dd className="text-gray-900">{getTaskTypeLabel(detail.type)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase mb-0.5">우선순위</dt>
                  <dd>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(detail.priority)}`}>
                      {getPriorityLabel(detail.priority)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase mb-0.5">상태</dt>
                  <dd>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getTaskStatusColor(detail.status)}`}>
                      {getTaskStatusLabel(detail.status)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase mb-0.5">케어대상</dt>
                  <dd className="text-gray-900">{detail.careTargetName || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase mb-0.5">할당자</dt>
                  <dd className="text-gray-900">{detail.assignedToName || '미할당'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase mb-0.5">마감일</dt>
                  <dd className="text-gray-900">{formatDate(detail.dueDate)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase mb-0.5">등록 시각</dt>
                  <dd className="text-gray-900">{formatDateTime(detail.createdAt)}</dd>
                </div>
              </dl>
            )}
          </div>
          <div className="p-6 border-t border-gray-200 flex-shrink-0 flex gap-2 justify-end">
            {!loading && detail && detail.status !== 'DONE' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit && onEdit(detail);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                수정
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-[#008080] rounded-lg hover:bg-[#006666]"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
