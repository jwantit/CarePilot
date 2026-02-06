import React, { useState } from "react";
import TaskListTab from "../../components/task/TaskListTab";
import AITaskListTab from "../../components/task/AITaskListTab";
import Breadcrumb from "../../components/common/Breadcrumb";

const TaskPage = () => {
  const [activeTab, setActiveTab] = useState("task"); // 'task' | 'ai'

  return (
    <div className="space-y-6">
      <Breadcrumb items={["작업 관리"]} />

      {/* 탭 메뉴 - CallPage와 동일한 스타일 적용 */}
      <div className="flex border-b border-cp-border mb-4">
        <button
          type="button"
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "task"
              ? "border-b-2 border-teal-500 text-teal-400 font-bold"
              : "text-cp-muted hover:text-cp-text border-b-2 border-transparent"
          }`}
          onClick={() => setActiveTab("task")}
        >
          할 일 목록
        </button>
        <button
          type="button"
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "ai"
              ? "border-b-2 border-teal-500 text-teal-400 font-bold"
              : "text-cp-muted hover:text-cp-text border-b-2 border-transparent"
          }`}
          onClick={() => setActiveTab("ai")}
        >
          AI 처리 내역
        </button>
      </div>

      {/* 컨텐츠 영역 - 불필요한 외곽 박스 제거 */}
      <div>
        {activeTab === "task" && <TaskListTab />}
        {activeTab === "ai" && <AITaskListTab />}
      </div>
    </div>
  );
};

export default TaskPage;
