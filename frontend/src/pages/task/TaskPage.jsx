import React, { useState } from "react";
import TaskListTab from "../../components/task/TaskListTab";
import AITaskListTab from "../../components/task/AITaskListTab";
import Breadcrumb from "../../components/common/Breadcrumb";

const TaskPage = () => {
  const [activeTab, setActiveTab] = useState("task"); // 'task' | 'ai'

  return (
    <div className="space-y-6">
      <Breadcrumb items={["작업 관리"]} />

      {/* CareTargetPage의 테이블 컨테이너 스타일 적용 (bg-slate-800 border border-slate-700) */}
      <div className="bg-slate-800 border border-slate-700 overflow-hidden shadow-lg">
        {/* 탭 헤더 영역 - CareTargetPage의 테이블 헤더 스타일(bg-slate-900 + border-teal-500/30) 적용 */}
        <div className="flex bg-slate-900 border-b-2 border-teal-500/30 px-2">
          <button
            type="button"
            className={`px-6 py-3.5 font-semibold text-sm transition-all relative ${
              activeTab === "task"
                ? "text-teal-400 border-b-2 border-teal-400"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
            onClick={() => setActiveTab("task")}
          >
            할 일 목록
          </button>
          <button
            type="button"
            className={`px-6 py-3.5 font-semibold text-sm transition-all relative ${
              activeTab === "ai"
                ? "text-teal-400 border-b-2 border-teal-400"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
            onClick={() => setActiveTab("ai")}
          >
            AI 처리 내역
          </button>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="p-6">
          {activeTab === "task" && <TaskListTab />}
          {activeTab === "ai" && <AITaskListTab />}
        </div>
      </div>
    </div>
  );
};

export default TaskPage;
