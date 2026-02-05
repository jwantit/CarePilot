import React from "react";
import { useSearchParams } from "react-router-dom";
import CallHistoryTab from "../../components/call/CallHistoryTab";
import CallScheduleTab from "../../components/call/CallScheduleTab";

const CallPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "history"; // URL 파라미터에서 탭 읽기, 없으면 기본값 'history'

  const handleTabChange = (tab) => {
    setSearchParams({ tab }); // URL 파라미터 업데이트
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">통화 관리</h1>

      {/* 탭 메뉴 */}
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 ${activeTab === "history" ? "border-b-2 border-[#008080] font-bold" : ""}`}
          onClick={() => handleTabChange("history")}
        >
          통화 이력
        </button>
        <button
          className={`px-4 py-2 ${activeTab === "schedule" ? "border-b-2 border-[#008080] font-bold" : ""}`}
          onClick={() => handleTabChange("schedule")}
        >
          통화 스케줄
        </button>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="bg-white rounded shadow p-4">
        {activeTab === "history" && <CallHistoryTab />}
        {activeTab === "schedule" && <CallScheduleTab />}
      </div>
    </div>
  );
};

export default CallPage;
