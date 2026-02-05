import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useTaskList } from "../../hooks/task/useTaskList";
import { getCareTargetAllList } from "../../api/caretarget/careTargetApi";
import { getTask } from "../../api/task/taskApi";
import TaskFilters from "./TaskFilters";
import TaskTable from "./TaskTable";
import TaskFormModal from "./TaskFormModal";
import TaskDetailModal from "./TaskDetailModal";
import Loading from "../common/Loading";
import StatCardGrid from "../common/StatCardGrid";
import { ListTodo, Clock, Play, CheckCircle } from "lucide-react";

const TaskListTab = () => {
  const auth = useSelector((state) => state.auth);
  const organizationId = auth?.user?.organizationId;

  const {
    taskList,
    staffList,
    loading,
    filters,
    updateFilter,
    handleCreateTask,
    handleUpdateTask,
    handleUpdateStatus,
    handleStart,
    handleUpdateAssign,
    handleDeleteTask,
  } = useTaskList();

  const [careTargetList, setCareTargetList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  useEffect(() => {
    if (!organizationId) return;
    getCareTargetAllList(organizationId, '')
      .then((data) => setCareTargetList(Array.isArray(data) ? data : []))
      .catch(() => setCareTargetList([]));
  }, [organizationId]);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleOpenDetail = (task) => {
    setSelectedTaskId(task.taskId);
    setDetailModalOpen(true);
  };

  const handleOpenEdit = async (task) => {
    setDetailModalOpen(false);
    // 상세 모달에서 넘긴 경우 이미 description 등 전체 데이터 보유
    if ('description' in task) {
      setEditingTask(task);
      setModalOpen(true);
      return;
    }
    try {
      const fullTask = await getTask(task.taskId);
      setEditingTask(fullTask);
      setModalOpen(true);
    } catch {
      setEditingTask(task);
      setModalOpen(true);
    }
  };

  const handleModalSubmit = async (body) => {
    try {
      if (editingTask) {
        await handleUpdateTask(editingTask.taskId, body);
      } else {
        await handleCreateTask(body);
      }
      setModalOpen(false);
      setEditingTask(null);
    } catch {
      // 훅에서 이미 toast 처리, 모달은 유지
    }
  };

  const handleDeleteTaskFromModal = async (taskId) => {
    try {
      await handleDeleteTask(taskId);
      setModalOpen(false);
      setEditingTask(null);
    } catch {
      // 훅에서 이미 toast 처리
    }
  };

  const taskStats = useMemo(() => {
    const list = taskList || [];
    return {
      total: list.length,
      waiting: list.filter((t) => t.status === "WAITING").length,
      progress: list.filter((t) => t.status === "PROGRESS").length,
      done: list.filter((t) => t.status === "DONE").length,
    };
  }, [taskList]);

  const statCards = useMemo(
    () => [
      { value: taskStats.total, label: "전체 작업", icon: ListTodo, iconColor: "text-teal-400", valueColor: "text-slate-100", hoverBorderColor: "hover:border-teal-500/50" },
      { value: taskStats.waiting, label: "대기", icon: Clock, iconColor: "text-yellow-400", valueColor: "text-yellow-400", hoverBorderColor: "hover:border-yellow-500/50" },
      { value: taskStats.progress, label: "진행중", icon: Play, iconColor: "text-blue-400", valueColor: "text-blue-400", hoverBorderColor: "hover:border-blue-500/50" },
      { value: taskStats.done, label: "완료", icon: CheckCircle, iconColor: "text-emerald-400", valueColor: "text-emerald-400", hoverBorderColor: "hover:border-emerald-500/50" },
    ],
    [taskStats]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <Loading />
      </div>
    );
  }

  return (
    <>
      <TaskFilters
        filters={filters}
        updateFilter={updateFilter}
        staffList={staffList}
        onAddClick={handleOpenCreate}
      />
      <TaskTable
        taskList={taskList}
        staffList={staffList}
        onStart={(task) => handleStart(task)}
        onComplete={(taskId) => handleUpdateStatus(taskId, 'DONE')}
        onEdit={handleOpenEdit}
        onDetail={handleOpenDetail}
        onAssignChange={handleUpdateAssign}
      />
      <TaskDetailModal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedTaskId(null);
        }}
        taskId={selectedTaskId}
        onEdit={handleOpenEdit}
      />
      <TaskFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleModalSubmit}
        onDelete={handleDeleteTaskFromModal}
        mode={editingTask ? 'edit' : 'create'}
        initialTask={editingTask}
        careTargetList={careTargetList}
        staffList={staffList}
      />
    </>
  );
};

export default TaskListTab;
