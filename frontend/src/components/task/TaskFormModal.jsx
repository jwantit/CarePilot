import React, { useState, useEffect } from "react";
import { X, FileText, PlusCircle } from "lucide-react";
import { TASK_TYPE_OPTIONS, PRIORITY_OPTIONS } from "../../utils/taskLabel";

const toDateTimeLocal = (dateString) => {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day}T${h}:${min}`;
  } catch {
    return "";
  }
};

const toISODateTime = (dateTimeLocal) => {
  if (!dateTimeLocal) return null;
  return new Date(dateTimeLocal).toISOString().slice(0, 19);
};

const inputClass =
  "w-full p-2.5 border border-slate-600 rounded-sm bg-slate-900 text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all";
const labelClass = "block text-sm font-semibold text-slate-200 mb-1.5";
const selectClass =
  "w-full p-2.5 border border-slate-600 rounded-sm bg-slate-900 text-slate-200 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none cursor-pointer";

const TaskFormModal = ({
  open,
  onClose,
  onSubmit,
  onDelete,
  mode = "create",
  initialTask = null,
  careTargetList = [],
  staffList = [],
}) => {
  const [careTargetId, setCareTargetId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("NORMAL");
  const [priority, setPriority] = useState("MEDIUM");
  const [assignedToUserId, setAssignedToUserId] = useState(null);
  const [dueDate, setDueDate] = useState("");

  const typeOptions = TASK_TYPE_OPTIONS.filter((o) => o.value !== "");
  const priorityOptions = PRIORITY_OPTIONS.filter((o) => o.value !== "");

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialTask) {
      setCareTargetId(initialTask.careTargetId ?? null);
      setTitle(initialTask.title ?? "");
      setDescription(initialTask.description ?? "");
      setType(initialTask.type ?? "NORMAL");
      setPriority(initialTask.priority ?? "MEDIUM");
      setAssignedToUserId(initialTask.assignedToUserId ?? null);
      setDueDate(toDateTimeLocal(initialTask.dueDate));
    } else {
      setCareTargetId(null);
      setTitle("");
      setDescription("");
      setType("NORMAL");
      setPriority("MEDIUM");
      setAssignedToUserId(null);
      setDueDate("");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-sm shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 shrink-0">
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            {mode === "edit" ? (
              <FileText size={24} className="text-teal-400" />
            ) : (
              <PlusCircle size={24} className="text-teal-400" />
            )}
            {mode === "edit" ? "작업 수정" : "작업 추가"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-sm text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className={labelClass}>제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder="제목"
            />
          </div>
          <div>
            <label className={labelClass}>설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={`${inputClass} resize-none`}
              placeholder="설명 (선택)"
            />
          </div>
          <div>
            <label className={labelClass}>유형</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>우선순위</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectClass}>
              {priorityOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>케어 대상</label>
            <select
              value={careTargetId ?? ""}
              onChange={(e) =>
                setCareTargetId(e.target.value === "" ? null : Number(e.target.value))
              }
              className={selectClass}
            >
              <option value="" className="bg-slate-900">선택 안 함</option>
              {careTargetList.map((c) => (
                <option key={c.careTargetId} value={c.careTargetId} className="bg-slate-900">
                  {c.name ?? c.careTargetId}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>할당자</label>
            <select
              value={assignedToUserId ?? ""}
              onChange={(e) =>
                setAssignedToUserId(e.target.value === "" ? null : Number(e.target.value))
              }
              className={selectClass}
            >
              <option value="" className="bg-slate-900">미할당</option>
              {staffList.map((s) => (
                <option key={s.userId} value={s.userId} className="bg-slate-900">
                  {s.name ?? s.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>마감일</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 pt-2">
            {mode === "edit" && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("정말 삭제하시겠습니까?")) {
                    onDelete(initialTask?.taskId);
                    onClose();
                  }
                }}
                className="px-4 py-3 rounded-sm font-semibold text-sm border border-red-500/50 text-red-400 hover:bg-red-500/20 transition-all"
              >
                삭제
              </button>
            )}
            <div className="flex gap-3 flex-1 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 max-w-[140px] py-3 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-600 text-slate-300 rounded-sm font-semibold hover:from-slate-800 hover:to-slate-900 hover:border-slate-500 hover:text-slate-100 transition-all shadow-md"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 max-w-[140px] py-3 bg-gradient-to-br from-teal-600 to-teal-700 border border-teal-500 text-white rounded-sm font-semibold hover:from-teal-500 hover:to-teal-600 transition-all shadow-md"
              >
                {mode === "edit" ? "저장" : "등록"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModal;
