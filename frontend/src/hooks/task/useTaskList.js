import { useState, useEffect, useCallback } from 'react';
import {
  getTaskList,
  createTask,
  updateTask,
  updateTaskStatus,
  updateTaskAssign,
  deleteTask,
} from '../../api/task/taskApi';
import { getStaffList } from '../../api/user/userApi';
import { toast } from 'react-hot-toast';

const defaultFilters = {
  sourceType: 'USER',
  status: '',
  priority: '',
  type: '',
  assignedToUserId: null,
};

export const useTaskList = () => {
  const [taskList, setTaskList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(defaultFilters);

  const buildParams = useCallback(() => {
    const params = {};
    if (filters.sourceType) params.sourceType = filters.sourceType;
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.type) params.type = filters.type;
    if (filters.assignedToUserId != null && filters.assignedToUserId !== '') {
      params.assignedToUserId = filters.assignedToUserId;
    }
    return params;
  }, [filters]);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTaskList(buildParams());
      setTaskList(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || '작업 목록을 불러오는데 실패했습니다.';
      toast.error(msg);
      setTaskList([]);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const fetchStaff = useCallback(async () => {
    try {
      const data = await getStaffList();
      setStaffList(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || '직원 목록을 불러오는데 실패했습니다.';
      toast.error(msg);
      setStaffList([]);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleCreateTask = async (body) => {
    try {
      await createTask(body);
      toast.success('작업이 등록되었습니다.');
      fetchTasks();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || '작업 등록에 실패했습니다.';
      toast.error(msg);
      throw err;
    }
  };

  const handleUpdateTask = async (taskId, body) => {
    try {
      await updateTask(taskId, body);
      toast.success('작업이 수정되었습니다.');
      fetchTasks();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || '작업 수정에 실패했습니다.';
      toast.error(msg);
      throw err;
    }
  };

  const handleUpdateStatus = async (taskId, status) => {
    try {
      await updateTaskStatus(taskId, status);
      toast.success('상태가 변경되었습니다.');
      fetchTasks();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || '상태 변경에 실패했습니다.';
      toast.error(msg);
    }
  };

  /** 시작: PROGRESS로 변경 (백엔드에서 자동으로 CALL/SMS 자동화 분기 처리) */
  const handleStart = async (task) => {
    // AI가 감지한 Task인지 확인 (SCHEDULE_CHANGE 타입이고 CALL 또는 SMS 연결됨)
    const isAiDetectedTask = task?.type === 'SCHEDULE_CHANGE' && (task?.callId || task?.inboundSmsId);
    
    try {
      await updateTaskStatus(task.taskId, 'PROGRESS');
      
      // Task 타입에 따라 적절한 메시지 표시
      if (isAiDetectedTask) {
        toast.success('AI가 예약 변경을 처리하고 있습니다.');
      } else {
        toast.success('상태가 변경되었습니다.');
      }
      
      fetchTasks();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || '상태 변경에 실패했습니다.';
      toast.error(msg);
    }
  };

  const handleUpdateAssign = async (taskId, assignedToUserId) => {
    try {
      await updateTaskAssign(taskId, assignedToUserId);
      toast.success('할당자가 변경되었습니다.');
      fetchTasks();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || '할당 변경에 실패했습니다.';
      toast.error(msg);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      toast.success('삭제되었습니다.');
      fetchTasks();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || '삭제에 실패했습니다.';
      toast.error(msg);
    }
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ ...defaultFilters });
  };

  return {
    taskList,
    staffList,
    loading,
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    fetchTasks,
    handleCreateTask,
    handleUpdateTask,
    handleUpdateStatus,
    handleStart,
    handleUpdateAssign,
    handleDeleteTask,
  };
};
