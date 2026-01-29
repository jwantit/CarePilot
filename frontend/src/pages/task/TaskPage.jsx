import React, { useState } from 'react';
import TaskListTab from '../../components/task/TaskListTab';
import AITaskListTab from '../../components/task/AITaskListTab';

const TaskPage = () => {
  const [activeTab, setActiveTab] = useState('task'); // 'task' | 'ai'

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">작업 관리</h1>
        <p className="text-gray-500">할 일 목록 및 AI 처리 내역을 관리하세요.</p>
      </div>

      <div className="flex border-b border-gray-200 mb-4">
        <button
          type="button"
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'task'
              ? 'border-b-2 border-[#008080] text-[#008080]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('task')}
        >
          할 일 목록
        </button>
        <button
          type="button"
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'ai'
              ? 'border-b-2 border-[#008080] text-[#008080]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('ai')}
        >
          AI 처리 내역
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        {activeTab === 'task' && <TaskListTab />}
        {activeTab === 'ai' && <AITaskListTab />}
      </div>
    </div>
  );
};

export default TaskPage;
