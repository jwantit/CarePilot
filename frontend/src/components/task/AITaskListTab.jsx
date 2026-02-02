import React, { useState } from 'react';
import { useAITaskList } from '../../hooks/task/useAITaskList';
import AITaskFilters from './AITaskFilters';
import AITaskTable from './AITaskTable';
import AITaskDetailModal from './AITaskDetailModal';
import Loading from '../common/Loading';

const AITaskListTab = () => {
  const { aiTaskList, loading, filters, updateFilter } = useAITaskList();
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading />
      </div>
    );
  }

  return (
    <>
      <AITaskFilters filters={filters} updateFilter={updateFilter} />
      <AITaskTable
        aiTaskList={aiTaskList}
        onDetail={(taskId) => setSelectedTaskId(taskId)}
      />
      <AITaskDetailModal
        open={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        taskId={selectedTaskId}
      />
    </>
  );
};

export default AITaskListTab;
