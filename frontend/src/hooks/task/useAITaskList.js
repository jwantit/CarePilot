import { useState, useEffect, useCallback } from 'react';
import { getAITaskList } from '../../api/task/aiTaskApi';
import { toast } from 'react-hot-toast';

const defaultFilters = {
  status: '',
  taskType: '',
};

export const useAITaskList = () => {
  const [aiTaskList, setAITaskList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(defaultFilters);

  const buildParams = useCallback(() => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.taskType) params.taskType = filters.taskType;
    return params;
  }, [filters]);

  const fetchAITasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAITaskList(buildParams());
      setAITaskList(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'AI 처리 내역을 불러오는데 실패했습니다.';
      toast.error(msg);
      setAITaskList([]);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchAITasks();
  }, [fetchAITasks]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return {
    aiTaskList,
    loading,
    filters,
    setFilters,
    updateFilter,
    fetchAITasks,
  };
};
