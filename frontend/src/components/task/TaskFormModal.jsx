import React, { useState, useEffect } from "react";
import { X, FileText, PlusCircle, ClipboardList, UserCheck, Calendar } from "lucide-react";
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
  "w-full p-2.5 border border-cp-border rounded-sm bg-cp-input text-cp-text placeholder:text-cp-muted focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all";
const labelClass = "block text-sm font-semibold text-cp-text mb-1.5";
const selectClass =
  "w-full p-2.5 border border-cp-border rounded-sm bg-cp-input text-cp-text focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none cursor-pointer transition-all";

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
      <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-sm shadow-xl w-full max-w-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-5 border-b border-cp-border bg-gradient-to-r from-cp-card to-cp-bg shrink-0">
          <h3 className="text-xl font-bold text-cp-text flex items-center gap-2">
            {mode === "edit" ? (
              <FileText size={24} className="text-teal-400" />
            ) : (
              <PlusCircle size={24} className="text-teal-400" />
            )}
            {mode === "edit" ? "작업 정보 수정" : "신규 작업 등록"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-sm text-cp-muted hover:bg-cp-bg hover:text-cp-text transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh] modal-scrollbar">
          <div className="grid grid-cols-2 gap-5">
            {/* 섹션 1: 작업 기본 정보 */}
            <div className="col-span-2 flex items-center gap-2 mb-1 pb-1 border-b border-cp-border text-teal-400 font-bold text-sm">
              <ClipboardList size={16} /> 작업 기본 정보
            </div>

            <div className="col-span-2">
              <label className={labelClass}>제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="작업 제목을 입력하세요"
                required
              />
            </div>

            <div>
              <label className={labelClass}>유형</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-cp-card">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>우선순위</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectClass}>
                {priorityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-cp-card">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 섹션 2: 할당 및 대상 정보 */}
            <div className="col-span-2 flex items-center gap-2 mt-4 mb-1 pb-1 border-b border-cp-border text-teal-400 font-bold text-sm">
              <UserCheck size={16} /> 할당 및 대상 정보
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
                <option value="" className="bg-cp-card">대상자 미지정</option>
                {careTargetList.map((c) => (
                  <option key={c.careTargetId} value={c.careTargetId} className="bg-cp-card">
                    {c.name ?? c.careTargetId}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>담당 직원</label>
              <select
                value={assignedToUserId ?? ""}
                onChange={(e) =>
                  setAssignedToUserId(e.target.value === "" ? null : Number(e.target.value))
                }
                className={selectClass}
              >
                <option value="" className="bg-cp-card">직원 미할당</option>
                {staffList.map((s) => (
                  <option key={s.userId} value={s.userId} className="bg-cp-card">
                    {s.name ?? s.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className={`${labelClass} flex items-center gap-1`}>
                <Calendar size={14} className="text-teal-400" /> 마감 기한
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`${inputClass}`}
              />
            </div>

            {/* 섹션 3: 상세 설명 */}
            <div className="col-span-2 flex items-center gap-2 mt-4 mb-1 pb-1 border-b border-cp-border text-teal-400 font-bold text-sm">
              <FileText size={16} /> 상세 설명
            </div>

            <div className="col-span-2">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="작업에 대한 상세 내용을 입력하세요 (선택)"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-10">
            {mode === "edit" && onDelete ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("정말 삭제하시겠습니까?")) {
                      onDelete(initialTask?.taskId);
                      onClose();
                    }
                  }}
                  className="px-6 py-3 border border-red-500/50 text-red-400 rounded-sm font-semibold hover:bg-red-500/10 transition-all shadow-md"
                >
                  삭제
                </button>
                <div className="flex gap-3 flex-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 bg-cp-input border border-cp-border text-cp-muted rounded-sm font-semibold hover:bg-cp-bg hover:text-cp-text transition-all shadow-md"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-br from-teal-600 to-teal-700 border border-teal-500 text-white rounded-sm font-semibold hover:from-teal-500 hover:to-teal-600 transition-all shadow-md"
                  >
                    저장 완료
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-cp-input border border-cp-border text-cp-muted rounded-sm font-semibold hover:bg-cp-bg hover:text-cp-text transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-br from-teal-600 to-teal-700 border border-teal-500 text-white rounded-sm font-semibold hover:from-teal-500 hover:to-teal-600 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  작업 등록 완료
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModal;
