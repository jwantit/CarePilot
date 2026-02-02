import React, { useState, useEffect } from 'react';
import {
  TASK_TYPE_OPTIONS,
  PRIORITY_OPTIONS,
} from '../../utils/taskLabel';

const toDateTimeLocal = (dateString) => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day}T${h}:${min}`;
  } catch {
    return '';
  }
};

const toISODateTime = (dateTimeLocal) => {
  if (!dateTimeLocal) return null;
  return new Date(dateTimeLocal).toISOString().slice(0, 19);
};

const TaskFormModal = ({
  open,
  onClose,
  onSubmit,
  onDelete,
  mode = 'create',
  initialTask = null,
  careTargetList = [],
  staffList = [],
}) => {
  const [careTargetId, setCareTargetId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('NORMAL');
  const [priority, setPriority] = useState('MEDIUM');
  const [assignedToUserId, setAssignedToUserId] = useState(null);
  const [dueDate, setDueDate] = useState('');

  const typeOptions = TASK_TYPE_OPTIONS.filter((o) => o.value !== '');
  const priorityOptions = PRIORITY_OPTIONS.filter((o) => o.value !== '');

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initialTask) {
      setCareTargetId(initialTask.careTargetId ?? null);
      setTitle(initialTask.title ?? '');
      setDescription(initialTask.description ?? '');
      setType(initialTask.type ?? 'NORMAL');
      setPriority(initialTask.priority ?? 'MEDIUM');
      setAssignedToUserId(initialTask.assignedToUserId ?? null);
      setDueDate(toDateTimeLocal(initialTask.dueDate));
    } else {
      setCareTargetId(null);
      setTitle('');
      setDescription('');
      setType('NORMAL');
      setPriority('MEDIUM');
      setAssignedToUserId(null);
      setDueDate('');
    }
  }, [open, mode, initialTask]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const body = {
      careTargetId: careTargetId || null,
      title: title.trim() || null,
      description: description.trim() || null,
      type,
      priority,
      assignedToUserId: assignedToUserId || null,
      dueDate: toISODateTime(dueDate) || null,
    };
    onSubmit(body);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden />
        <div className="relative bg-white rounded-xl shadow-lg max-w-lg w-full p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {mode === 'edit' ? '작업 수정' : '작업 추가'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#008080] focus:border-[#008080] outline-none"
                placeholder="제목"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#008080] focus:border-[#008080] outline-none"
                placeholder="설명 (선택)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#008080] focus:border-[#008080] outline-none"
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#008080] focus:border-[#008080] outline-none"
              >
                {priorityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">케어 대상</label>
              <select
                value={careTargetId ?? ''}
                onChange={(e) =>
                  setCareTargetId(e.target.value === '' ? null : Number(e.target.value))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#008080] focus:border-[#008080] outline-none"
              >
                <option value="">선택 안 함</option>
                {careTargetList.map((c) => (
                  <option key={c.careTargetId} value={c.careTargetId}>
                    {c.name ?? c.careTargetId}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">할당자</label>
              <select
                value={assignedToUserId ?? ''}
                onChange={(e) =>
                  setAssignedToUserId(
                    e.target.value === '' ? null : Number(e.target.value)
                  )
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#008080] focus:border-[#008080] outline-none"
              >
                <option value="">미할당</option>
                {staffList.map((s) => (
                  <option key={s.userId} value={s.userId}>
                    {s.name ?? s.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">마감일</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#008080] focus:border-[#008080] outline-none"
              />
            </div>
            <div className="flex justify-between pt-2">
              <div>
                {mode === 'edit' && onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('정말 삭제하시겠습니까?')) {
                        onDelete(initialTask?.taskId);
                        onClose();
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                  >
                    삭제
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#008080] rounded-lg hover:bg-[#006666]"
                >
                  {mode === 'edit' ? '저장' : '등록'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskFormModal;
