import React, { useState, useMemo } from "react";
import { useAITaskList } from "../../hooks/task/useAITaskList";
import AITaskFilters from "./AITaskFilters";
import AITaskTable from "./AITaskTable";
import AITaskDetailModal from "./AITaskDetailModal";
import Loading from "../common/Loading";
import StatCardGrid from "../common/StatCardGrid";
import { Cpu, Clock, CheckCircle, XCircle } from "lucide-react";

const AITaskListTab = () => {
  const { aiTaskList, loading, filters, updateFilter } = useAITaskList();
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const aiStats = useMemo(() => {
    const list = aiTaskList || [];
    return {
      total: list.length,
      waiting: list.filter((t) => t.status === "WAITING").length,
      success: list.filter((t) => t.status === "SUCCESS").length,
      failed: list.filter((t) => t.status === "FAILED").length,
    };
  }, [aiTaskList]);

  const statCards = useMemo(
    () => [
      { value: aiStats.total, label: "전체 AI 작업", icon: Cpu, iconColor: "text-teal-400", valueColor: "text-slate-100", hoverBorderColor: "hover:border-teal-500/50" },
      { value: aiStats.waiting, label: "대기", icon: Clock, iconColor: "text-yellow-400", valueColor: "text-yellow-400", hoverBorderColor: "hover:border-yellow-500/50" },
      { value: aiStats.success, label: "성공", icon: CheckCircle, iconColor: "text-emerald-400", valueColor: "text-emerald-400", hoverBorderColor: "hover:border-emerald-500/50" },
      { value: aiStats.failed, label: "실패", icon: XCircle, iconColor: "text-red-400", valueColor: "text-red-400", hoverBorderColor: "hover:border-red-500/50" },
    ],
    [aiStats]
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
      <StatCardGrid cards={statCards} columns={4} />
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
