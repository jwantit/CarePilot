import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTaskList } from '../../hooks/task/useTaskList';
import { getCareTargetAllList } from '../../api/caretarget/careTargetApi';
import { getTask } from '../../api/task/taskApi';
import TaskFilters from './TaskFilters';
import TaskTable from './TaskTable';
import TaskFormModal from './TaskFormModal';
import TaskDetailModal from './TaskDetailModal';
import Loading from '../common/Loading';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
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
      />
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2 text-sm font-medium text-white bg-[#008080] rounded-lg hover:bg-[#006666]"
        >
          작업 추가
        </button>
      </div>
      <TaskTable
        taskList={taskList}
        staffList={staffList}
        onStart={(taskId) => handleUpdateStatus(taskId, 'PROGRESS')}
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
