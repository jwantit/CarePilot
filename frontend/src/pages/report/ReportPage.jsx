import React, { useState, useEffect } from "react";
import { getStatistics, getDiseaseList } from "../../api/report/reportApi";
import { getCareGroupList } from "../../api/caretarget/careTargetGroupApi";
import { useAuth } from "../../hooks/useAuth";
import html2pdf from "html2pdf.js";
import Breadcrumb from "../../components/common/Breadcrumb";
import OverviewTab from "../../components/report/OverviewTab";
import RiskAnalysisTab from "../../components/report/RiskAnalysisTab";
import CallAnalysisTab from "../../components/report/CallAnalysisTab";
import AIAutomationTab from "../../components/report/AIAutomationTab";
import { Download, RotateCcw } from "lucide-react";

function ReportPage() {
  const { user } = useAuth();
  const organizationId = user?.organizationId;

  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'risk', 'call', 'ai'
  const [dateRange, setDateRange] = useState("month"); // 'today', 'week', 'month', 'custom'
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedDisease, setSelectedDisease] = useState("");
  const [groups, setGroups] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false); // 날짜 선택기 팝오버 상태
  const [tempStartDate, setTempStartDate] = useState(null); // 팝오버용 임시 날짜
  const [tempEndDate, setTempEndDate] = useState(null); // 팝오버용 임시 날짜

  // 그룹 목록과 질환 목록 로드
  useEffect(() => {
    if (organizationId) {
      loadGroups();
      loadDiseases();
    }
  }, [organizationId]);

  // dateRange가 변경될 때 'custom'이 아니면 날짜 초기화
  useEffect(() => {
    if (dateRange !== "custom") {
      setStartDate(null);
      setEndDate(null);
    }
  }, [dateRange]);

  useEffect(() => {
    loadStatistics();
  }, [dateRange, startDate, endDate, selectedGroupId, selectedDisease]);

  const handleReset = () => {
    setDateRange("month");
    setStartDate(null);
    setEndDate(null);
    setTempStartDate(null);
    setTempEndDate(null);
    setSelectedGroupId(null);
    setSelectedDisease("");
    setIsDatePickerOpen(false);
  };

  const loadGroups = async () => {
    try {
      const data = await getCareGroupList(organizationId);
      setGroups(data || []);
    } catch (err) {
      console.error("그룹 목록 로딩 실패:", err);
    }
  };

  const loadDiseases = async () => {
    try {
      const data = await getDiseaseList();
      setDiseases(data || []);
    } catch (err) {
      console.error("질환 목록 로딩 실패:", err);
    }
  };

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      let start = startDate;
      let end = endDate;

      // 기본 기간 설정
      // dateRange가 'custom'이 아니면 startDate와 endDate를 무시하고 dateRange에 따라 설정
      if (dateRange !== "custom") {
        const now = new Date();
        switch (dateRange) {
          case "today":
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            end = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() + 1,
            );
            break;
          case "week":
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            end = new Date(weekStart);
            end.setDate(weekStart.getDate() + 7);
            start = weekStart;
            break;
          case "month":
          default:
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            break;
        }
      } else if (!start || !end) {
        // 'custom'인데 날짜가 설정되지 않은 경우 기본값 사용
        const now = new Date();
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      }

      // 년월일 시분초 형식으로 변환 (yyyy-MM-dd HH:mm:ss)
      const formatDateTime = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };

      const startFormatted = formatDateTime(start);
      const endFormatted = formatDateTime(end);

      const data = await getStatistics(
        startFormatted,
        endFormatted,
        selectedGroupId,
        selectedDisease || null,
      );
      setStatistics(data);
    } catch (err) {
      console.error("통계 데이터 로딩 실패:", err);
      setError("통계 데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return "0";
    return num.toLocaleString();
  };

  const formatPercent = (num) => {
    if (num === null || num === undefined) return "0";
    return `${num.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={["통계"]} />
        <div className="flex flex-col items-center justify-center p-20 gap-4 bg-cp-card border border-cp-border rounded-none">
          <div className="w-12 h-12 border-4 border-cp-border border-t-teal-400 rounded-full animate-spin" />
          <p className="text-cp-muted text-sm font-mono">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={["통계"]} />
        <div className="bg-red-500/10 border border-red-500/50 rounded-none p-4 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  const { summary, callStatistics, riskStatistics } = statistics;

  // PDF 내보내기 함수
  const handleExportPDF = () => {
    const element = document.getElementById("pdf-report-content");
    if (!element) {
      console.error("PDF로 변환할 요소를 찾을 수 없습니다.");
      return;
    }

    const opt = {
      margin: 10,
      filename: `report_${activeTab}_${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={["통계"]} />

      <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border p-5 mb-6 rounded-none shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-cp-muted uppercase tracking-wider">
              기간 선택
            </span>
            <div className="flex items-center gap-1.5 relative">
              <button
                className={`px-4 h-9 rounded-none text-xs font-semibold transition-all border ${
                  dateRange === "today"
                    ? "bg-cp-input text-teal-400 border-teal-500/50 hover:border-teal-500 shadow-md"
                    : "bg-cp-input text-cp-muted border border-cp-border hover:bg-cp-bg"
                }`}
                onClick={() => {
                  setDateRange("today");
                  setIsDatePickerOpen(false);
                }}
              >
                오늘
              </button>
              <button
                className={`px-4 h-9 rounded-none text-xs font-semibold transition-all border ${
                  dateRange === "week"
                    ? "bg-cp-input text-teal-400 border-teal-500/50 hover:border-teal-500 shadow-md"
                    : "bg-cp-input text-cp-muted border border-cp-border hover:bg-cp-bg"
                }`}
                onClick={() => {
                  setDateRange("week");
                  setIsDatePickerOpen(false);
                }}
              >
                이번 주
              </button>
              <button
                className={`px-4 h-9 rounded-none text-xs font-semibold transition-all border ${
                  dateRange === "month"
                    ? "bg-cp-input text-teal-400 border-teal-500/50 hover:border-teal-500 shadow-md"
                    : "bg-cp-input text-cp-muted border border-cp-border hover:bg-cp-bg"
                }`}
                onClick={() => {
                  setDateRange("month");
                  setIsDatePickerOpen(false);
                }}
              >
                이번 달
              </button>
              <button
                className={`px-4 h-9 rounded-none text-xs font-semibold transition-all border ${
                  dateRange === "custom"
                    ? "bg-cp-input text-teal-400 border-teal-500/50 hover:border-teal-500 shadow-md"
                    : "bg-cp-input text-cp-muted border border-cp-border hover:bg-cp-bg"
                }`}
                onClick={() => {
                  setDateRange("custom");
                  setTempStartDate(startDate);
                  setTempEndDate(endDate);
                  setIsDatePickerOpen(!isDatePickerOpen);
                }}
              >
                {dateRange === "custom" && startDate && endDate
                  ? `${startDate.toISOString().split("T")[0]} ~ ${endDate.toISOString().split("T")[0]}`
                  : "직접 선택"}
              </button>

              {/* 날짜 선택 팝오버 */}
              {isDatePickerOpen && (
                <div className="absolute top-10 left-0 z-50 bg-cp-card border border-cp-border p-4 shadow-2xl space-y-3 min-w-[320px]">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-teal-400 uppercase">시작일</span>
                    <input
                      type="date"
                      className="h-9 px-3 border border-cp-border rounded-none bg-cp-input text-cp-text text-sm focus:ring-1 focus:ring-teal-500 outline-none w-full"
                      value={tempStartDate ? tempStartDate.toISOString().split("T")[0] : ""}
                      onChange={(e) => setTempStartDate(new Date(e.target.value))}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-teal-400 uppercase">종료일</span>
                    <input
                      type="date"
                      className="h-9 px-3 border border-cp-border rounded-none bg-cp-input text-cp-text text-sm focus:ring-1 focus:ring-teal-500 outline-none w-full"
                      value={tempEndDate ? tempEndDate.toISOString().split("T")[0] : ""}
                      onChange={(e) => setTempEndDate(new Date(e.target.value))}
                    />
                  </div>
                  <div className="pt-2 border-t border-cp-border flex justify-end gap-2">
                    <button
                      onClick={() => setIsDatePickerOpen(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-cp-muted hover:text-cp-text transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => {
                        setStartDate(tempStartDate);
                        setEndDate(tempEndDate);
                        setIsDatePickerOpen(false);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-teal-600/20 text-teal-400 border border-teal-500/30 hover:bg-teal-600/30 transition-all"
                    >
                      적용하기
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-cp-muted uppercase tracking-wider">
              그룹
            </span>
            <select
              className="h-9 px-3 min-w-[120px] border border-cp-border rounded-none bg-cp-input text-cp-text text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none cursor-pointer"
              value={selectedGroupId || ""}
              onChange={(e) =>
                setSelectedGroupId(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            >
              <option value="">전체</option>
              {groups.map((group) => (
                <option key={group.groupId} value={group.groupId}>
                  {group.groupName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-cp-muted uppercase tracking-wider">
              질환
            </span>
            <select
              className="h-9 px-3 min-w-[120px] border border-cp-border rounded-none bg-cp-input text-cp-text text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none cursor-pointer"
              value={selectedDisease}
              onChange={(e) => setSelectedDisease(e.target.value)}
            >
              <option value="">전체</option>
              {diseases.map((disease) => (
                <option key={disease} value={disease}>
                  {disease}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleReset}
            className="h-9 flex items-center gap-1.5 px-4 bg-cp-input border border-cp-border text-cp-muted text-sm font-semibold hover:bg-cp-bg hover:text-cp-text transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 rounded-sm"
          >
            <RotateCcw size={14} />
            전체보기
          </button>

          <div className="flex-1" />

          <button
            onClick={handleExportPDF}
            className="h-9 flex items-center gap-2 px-5 bg-cp-input hover:bg-cp-bg text-teal-400 text-sm font-semibold transition-all border border-teal-500/50 hover:border-teal-500 rounded-none shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <Download size={18} />
            PDF 내보내기
          </button>
        </div>

        <div className="mt-8 pt-4 border-t border-cp-border/50">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 font-semibold text-base border-b-2 transition-colors ${
                activeTab === "overview"
                  ? "border-teal-500 text-teal-400"
                  : "border-transparent text-cp-muted hover:text-cp-text"
              }`}
            >
              개요
            </button>
            <button
              onClick={() => setActiveTab("risk")}
              className={`px-4 py-2 font-semibold text-base border-b-2 transition-colors ${
                activeTab === "risk"
                  ? "border-teal-500 text-teal-400"
                  : "border-transparent text-cp-muted hover:text-cp-text"
              }`}
            >
              위험도 분석
            </button>
            <button
              onClick={() => setActiveTab("call")}
              className={`px-4 py-2 font-semibold text-base border-b-2 transition-colors ${
                activeTab === "call"
                  ? "border-teal-500 text-teal-400"
                  : "border-transparent text-cp-muted hover:text-cp-text"
              }`}
            >
              통화 분석
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`px-4 py-2 font-semibold text-base border-b-2 transition-colors ${
                activeTab === "ai"
                  ? "border-teal-500 text-teal-400"
                  : "border-transparent text-cp-muted hover:text-cp-text"
              }`}
            >
              AI 자동화
            </button>
          </nav>
        </div>
      </div>

      {/* 탭별 컨텐츠 */}
      <div id="pdf-report-content">
        {activeTab === "overview" && (
          <OverviewTab
            statistics={statistics}
            formatNumber={formatNumber}
            formatPercent={formatPercent}
          />
        )}

        {activeTab === "risk" && <RiskAnalysisTab statistics={statistics} />}

        {activeTab === "call" && <CallAnalysisTab statistics={statistics} />}

        {activeTab === "ai" && (
          <AIAutomationTab
            statistics={statistics}
            formatNumber={formatNumber}
            formatPercent={formatPercent}
          />
        )}
      </div>
    </div>
  );
}

export default ReportPage;
