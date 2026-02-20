import React from "react";
import TaskRow from "./TaskRow";

const TaskTable = ({
  taskList,
  onStart,
  onComplete,
  onEdit,
  onDetail,
  onAssignChange,
  staffList,
}) => {
  if (!taskList || taskList.length === 0) {
    return (
      <div className="bg-cp-card border border-cp-border p-12 text-center">
        <p className="text-cp-muted text-sm">등록된 작업이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-cp-card border border-cp-border overflow-hidden shadow-xl">
      {/* 테이블 헤더 - CareTarget 스타일 동일 적용 (8열) */}
      <div className="grid grid-cols-8 bg-cp-header border-b-2 border-teal-500/30 py-3.5 px-4 text-sm font-semibold text-white dark:text-cp-text text-center items-center min-h-[48px]">
        <div className="text-white dark:text-teal-400">우선순위</div>
        <div className="text-white dark:text-teal-400">제목</div>
        <div className="text-white dark:text-teal-400">케어 대상</div>
        <div className="text-white dark:text-teal-400">유형</div>
        <div className="text-white dark:text-teal-400">할당자</div>
        <div className="text-white dark:text-teal-400">마감일</div>
        <div className="text-white dark:text-teal-400">상태</div>
        <div className="text-white dark:text-teal-400">관리</div>
      </div>

      {/* 데이터 행 */}
      <div className="">
        {taskList.map((task) => (
          <TaskRow
            key={task.taskId}
            task={task}
            onDetail={onDetail}
            onAssignChange={onAssignChange}
            staffList={staffList}
            onStart={onStart}
            onComplete={onComplete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskTable;
