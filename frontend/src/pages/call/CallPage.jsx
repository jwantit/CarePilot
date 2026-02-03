import React, { useState } from "react";
import CallHistoryTab from "../../components/call/CallHistoryTab";
import CallScheduleTab from "../../components/call/CallScheduleTab";

const CallPage = () => {
  const [activeTab, setActiveTab] = useState("history"); // 'history', 'schedule', 'inbound-sms'

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">통화 관리</h1>

      {/* 탭 메뉴 */}
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 ${activeTab === "history" ? "border-b-2 border-[#008080] font-bold" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          통화 이력
        </button>
        <button
          className={`px-4 py-2 ${activeTab === "schedule" ? "border-b-2 border-[#008080] font-bold" : ""}`}
          onClick={() => setActiveTab("schedule")}
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
