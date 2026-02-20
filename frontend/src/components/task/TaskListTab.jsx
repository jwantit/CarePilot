import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom"; // 작업 필터 로직 임포트
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
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    taskList,
    staffList,
    loading,
    filters,
    updateFilter,
    resetFilters,
    handleCreateTask,
    handleUpdateTask,
    handleUpdateStatus,
    handleStart,
    handleUpdateAssign,
    handleDeleteTask,
  } = useTaskList();

  // URL 파라미터에서 필터 상태 읽기
  const filterStatusParam = searchParams.get('filterStatus');

  // URL 파라미터로부터 필터 초기화
  useEffect(() => {
    if (filterStatusParam) {
      // 콤마로 구분된 상태들을 파싱
      const statuses = filterStatusParam.split(',').map(s => s.trim());
      // 필터에 적용 (여러 상태를 지원하기 위해 필터링 로직 사용)
      // updateFilter는 단일 값만 받을 수 있으므로, 필터링은 filteredTaskList에서 처리
    }
  }, [filterStatusParam]);

  // 필터링된 작업 목록 (URL 파라미터 기반)
  const filteredTaskList = useMemo(() => {
    if (!filterStatusParam) return taskList;
    
    const statuses = filterStatusParam.split(',').map(s => s.trim().toUpperCase());
    return taskList.filter(task => {
      if (!task.status) return false;
      // IN_PROGRESS, INPROGRESS, PROGRESS 모두 처리
      const normalizedStatus = task.status.toUpperCase();
      if (normalizedStatus === 'INPROGRESS' || normalizedStatus === 'PROGRESS') {
        return statuses.includes('IN_PROGRESS') || statuses.includes('INPROGRESS') || statuses.includes('PROGRESS');
      }
      return statuses.includes(normalizedStatus);
    });
  }, [taskList, filterStatusParam]);
// 까지 작업 필터링 로직
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

  const handleReset = () => {
    resetFilters();
    setSearchParams({});
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
    const list = filteredTaskList || [];
    return {
      total: list.length,
      waiting: list.filter((t) => t.status === "WAITING").length,
      progress: list.filter((t) => t.status === "PROGRESS" || t.status === "IN_PROGRESS" || t.status === "INPROGRESS").length,
      done: list.filter((t) => t.status === "DONE").length,
    };
  }, [filteredTaskList]);

  const statCards = useMemo(
    () => [
      { value: taskStats.total, label: "전체 작업", icon: ListTodo, iconColor: "text-teal-400", valueColor: "text-cp-text", hoverBorderColor: "hover:border-teal-500/50" },
      { value: taskStats.waiting, label: "대기", icon: Clock, iconColor: "text-yellow-400", valueColor: "text-yellow-400", hoverBorderColor: "hover:border-yellow-500/50" },
      { value: taskStats.progress, label: "진행중", icon: Play, iconColor: "text-blue-400", valueColor: "text-blue-400", hoverBorderColor: "hover:border-blue-500/50" },
      { value: taskStats.done, label: "완료", icon: CheckCircle, iconColor: "text-emerald-400", valueColor: "text-emerald-400", hoverBorderColor: "hover:border-emerald-500/50" },
    ],
    [taskStats]
  );

  const handleStartTask = useCallback((task) => handleStart(task), [handleStart]);
  const handleCompleteTask = useCallback((taskId) => handleUpdateStatus(taskId, 'DONE'), [handleUpdateStatus]);
  const handleEditTask = useCallback((task) => handleOpenEdit(task), [handleOpenEdit]);
  const handleDetailTask = useCallback((task) => handleOpenDetail(task), [handleOpenDetail]);
  const handleAssignChange = useCallback((taskId, userId) => handleUpdateAssign(taskId, userId), [handleUpdateAssign]);

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
        onReset={handleReset}
      />
      <TaskTable
        taskList={filteredTaskList}
        staffList={staffList}
        onStart={handleStartTask}
        onComplete={handleCompleteTask}
        onEdit={handleEditTask}
        onDetail={handleDetailTask}
        onAssignChange={handleAssignChange}
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
