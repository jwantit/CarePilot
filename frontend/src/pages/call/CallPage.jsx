import React from "react";
import { useSearchParams } from "react-router-dom";
import CallHistoryTab from "../../components/call/CallHistoryTab";
import CallScheduleTab from "../../components/call/CallScheduleTab";
import Breadcrumb from "../../components/common/Breadcrumb";

const CallPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "history"; // URL 파라미터에서 탭 읽기, 없으면 기본값 'history'

  const handleTabChange = (tab) => {
    setSearchParams({ tab }); // URL 파라미터 업데이트
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={["통화 관리"]} />

      {/* 탭 메뉴 */}
      <div className="flex border-b border-cp-border mb-4">
        <div className="flex -mb-px">
          <button
            className={`px-4 py-2 font-medium text-base transition-colors ${
              activeTab === "history"
                ? "border-b-2 border-teal-500 text-teal-400 font-bold"
                : "text-cp-muted hover:text-cp-text border-b-2 border-transparent"
            }`}
            onClick={() => handleTabChange("history")}
          >
            통화 이력
          </button>
          <button
            className={`px-4 py-2 font-medium text-base transition-colors ${
              activeTab === "schedule"
                ? "border-b-2 border-teal-500 text-teal-400 font-bold"
                : "text-cp-muted hover:text-cp-text border-b-2 border-transparent"
            }`}
            onClick={() => handleTabChange("schedule")}
          >
            통화 스케줄
          </button>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div>
        {activeTab === "history" && <CallHistoryTab />}
        {activeTab === "schedule" && <CallScheduleTab />}
      </div>
    </div>
  );
};

export default CallPage;
