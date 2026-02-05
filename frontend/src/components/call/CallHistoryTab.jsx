import React, { useEffect, useMemo, useState } from "react";
import { API_SERVER_HOST } from "../../api/apiClient";
import { getCallHistoryWithPaging, getCallDetail } from "../../api/callApi";
import { useAuth } from "../../hooks/useAuth";

const CallHistoryTab = () => {
  const { user } = useAuth();
  const organizationId = user?.organizationId;
  const [history, setHistory] = useState([]);
  const [pageData, setPageData] = useState({
    page: 1,
    size: 10,
    total: 0,
    start: 1,
    end: 1,
    prev: false,
    next: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterTimeFrom, setFilterTimeFrom] = useState("");
  const [filterTimeTo, setFilterTimeTo] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterPatient, setFilterPatient] = useState("");
  const [filterResult, setFilterResult] = useState("");
  const [filterRiskLevel, setFilterRiskLevel] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      if (!organizationId) return;
      try {
        const res = await getCallHistoryWithPaging(
          organizationId,
          currentPage,
          10,
        );
        setHistory(res.dtoList || []);
        setPageData({
          page: res.page || 1,
          size: res.size || 10,
          total: res.total || 0,
          start: res.start || 1,
          end: res.end || 1,
          prev: res.prev || false,
          next: res.next || false,
        });
      } catch (error) {
        console.error("Failed to load call history", error);
        setHistory([]);
      }
    };

    loadHistory();
  }, [organizationId, currentPage]);

  const getRiskLevelDisplay = (riskLevel) => {
    const displayLevel = riskLevel || "LOW";

    const getRiskStyle = (level) => {
      switch (level) {
        case "CRITICAL":
          return "bg-purple-100 text-purple-700 border-purple-200";
        case "HIGH":
          return "bg-red-100 text-red-600 border-red-200";
        case "MEDIUM":
          return "bg-orange-100 text-orange-600 border-orange-200";
        case "LOW":
        default:
          return "bg-emerald-50 text-emerald-600 border-emerald-100";
      }
    };

    return (
      <div className="flex justify-center items-center">
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${getRiskStyle(displayLevel)}`}
        >
          {displayLevel}
        </span>
      </div>
    );
  };

  const openDetailModal = async (callId) => {
    setIsModalOpen(true);
    setDetail(null);
    setDetailError("");
    setIsDetailLoading(true);

    try {
      const callDetail = await getCallDetail(organizationId, callId);
      setDetail(callDetail);
    } catch (error) {
      setDetailError("상세 데이터를 불러오는 데 실패했습니다.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setDetail(null);
    setDetailError("");
  };

  const recordingUrl = detail?.recordingStoragePath
    ? `${API_SERVER_HOST}/display/${encodeURI(detail.recordingStoragePath)}`
    : null;

  const formatFileSize = (value) => {
    if (value == null) return "-";
    const units = ["B", "KB", "MB", "GB"];
    let size = value;
    let index = 0;

    while (size >= 1024 && index < units.length - 1) {
      size /= 1024;
      index += 1;
    }

    return `${size.toFixed(1)} ${units[index]}`;
  };

  const parseDateTime = (value) => {
    if (!value) return null;
    const normalized = value.replace(" ", "T");
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const filteredHistory = useMemo(() => {
    const from = parseDateTime(filterTimeFrom);
    const to = parseDateTime(filterTimeTo);

    return history.filter((item) => {
      const callDateTime = parseDateTime(item.startTime);
      const matchesFrom = !from || (callDateTime && callDateTime >= from);
      const matchesTo = !to || (callDateTime && callDateTime <= to);
      const matchesType = !filterType || item.direction === filterType;
      const matchesPatient =
        !filterPatient || item.careTargetName?.includes(filterPatient);
      const matchesResult =
        !filterResult || (item.statusLabel || item.status) === filterResult;
      const matchesRiskLevel =
        !filterRiskLevel || item.riskLevel === filterRiskLevel;

      return (
        matchesFrom &&
        matchesTo &&
        matchesType &&
        matchesPatient &&
        matchesResult &&
        matchesRiskLevel
      );
    });
  }, [
    history,
    filterTimeFrom,
    filterTimeTo,
    filterType,
    filterPatient,
    filterResult,
    filterRiskLevel,
  ]);

  return (
    <div className="relative">
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded border border-gray-200 bg-white p-4 text-xs font-medium uppercase tracking-wide text-gray-500 shadow-sm">
        <div className="flex flex-col gap-1">
          <span>시간</span>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              className="h-9 w-[220px] rounded border border-gray-300 px-2 text-sm text-slate-700"
              value={filterTimeFrom}
              onChange={(event) => setFilterTimeFrom(event.target.value)}
            />
            <input
              type="datetime-local"
              className="h-9 w-[220px] rounded border border-gray-300 px-2 text-sm text-slate-700"
              value={filterTimeTo}
              onChange={(event) => setFilterTimeTo(event.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <span>유형</span>
            <select
              className="h-9 min-w-[100px] rounded border border-gray-300 bg-white px-2 text-sm text-slate-700"
              value={filterType}
              onChange={(event) => setFilterType(event.target.value)}
            >
              <option value="">전체</option>
              <option value="수신">수신</option>
              <option value="발신">발신</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span>케어 대상</span>
            <input
              type="text"
              className="h-9 min-w-[150px] rounded border border-gray-300 px-2 text-sm text-slate-700"
              placeholder="이름 검색"
              value={filterPatient}
              onChange={(event) => setFilterPatient(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span>결과</span>
            <select
              className="h-9 min-w-[120px] rounded border border-gray-300 bg-white px-2 text-sm text-slate-700"
              value={filterResult}
              onChange={(event) => setFilterResult(event.target.value)}
            >
              <option value="">전체</option>
              <option value="성공">성공</option>
              <option value="실패">실패</option>
              <option value="무응답">무응답</option>
              <option value="취소됨">취소됨</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span>위험도</span>
            <select
              className="h-9 min-w-[120px] rounded border border-gray-300 bg-white px-2 text-sm text-slate-700"
              value={filterRiskLevel}
              onChange={(event) => setFilterRiskLevel(event.target.value)}
            >
              <option value="">전체</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => {
              setFilterTimeFrom("");
              setFilterTimeTo("");
              setFilterType("");
              setFilterPatient("");
              setFilterResult("");
              setFilterRiskLevel("");
            }}
            className="h-9 rounded border border-[#008080] bg-[#008080] px-4 text-sm font-medium text-white transition hover:bg-[#006666]"
          >
            초기화
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100 text-left text-sm font-medium text-gray-700">
              <th className="px-3 py-2 border">시간</th>
              <th className="px-3 py-2 border">ID</th>
              <th className="px-3 py-2 border">케어 대상</th>
              <th className="px-3 py-2 border">유형</th>
              <th className="px-3 py-2 border">통화 시간</th>
              <th className="px-3 py-2 border">결과</th>
              <th className="px-3 py-2 border text-center">위험도 (점수)</th>
              <th className="px-3 py-2 border">상세</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map((item) => (
              <tr key={item.callId} className="even:bg-white odd:bg-slate-50">
                <td className="px-3 py-2 border text-sm">{item.startTime}</td>
                <td className="px-3 py-2 border text-sm">{item.callId}</td>
                <td className="px-3 py-2 border text-sm">
                  {item.careTargetName}
                </td>
                <td className="px-3 py-2 border text-sm">{item.direction}</td>
                <td className="px-3 py-2 border text-sm">{item.duration}</td>
                <td className="px-3 py-2 border text-sm">
                  {item.statusLabel || item.status}
                </td>
                <td className="px-3 py-2 border text-sm">
                  <div className="flex items-center justify-center gap-2">
                    {getRiskLevelDisplay(item.riskLevel)}
                    <span className="text-xs text-gray-400">
                      ({item.riskScore ?? 0}점)
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 border text-sm">
                  <button
                    type="button"
                    className="rounded bg-[#008080] px-3 py-1 text-white transition hover:bg-[#006666]"
                    onClick={() => openDetailModal(item.callId)}
                  >
                    상세
                  </button>
                </td>
              </tr>
            ))}
            {filteredHistory.length === 0 && (
              <tr>
                <td
                  className="px-3 py-4 border text-center text-sm text-gray-500"
                  colSpan="8"
                >
                  표시할 통화 기록이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이징 UI */}
      {pageData.total > 0 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={!pageData.prev}
            className={`px-3 py-1 rounded border ${
              !pageData.prev
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            처음
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={!pageData.prev}
            className={`px-3 py-1 rounded border ${
              !pageData.prev
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            이전
          </button>
          {Array.from(
            { length: pageData.end - pageData.start + 1 },
            (_, i) => pageData.start + i,
          ).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => setCurrentPage(pageNum)}
              className={`px-3 py-1 rounded border ${
                pageNum === currentPage
                  ? "bg-[#008080] text-white border-[#008080]"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {pageNum}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!pageData.next}
            className={`px-3 py-1 rounded border ${
              !pageData.next
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            다음
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(pageData.end)}
            disabled={!pageData.next}
            className={`px-3 py-1 rounded border ${
              !pageData.next
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            마지막
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold">통화 상세</h3>
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-gray-900"
                onClick={closeModal}
              >
                닫기
              </button>
            </div>

            {isDetailLoading ? (
              <p className="text-sm text-gray-500">
                상세 정보를 불러오는 중입니다...
              </p>
            ) : detailError ? (
              <p className="text-sm text-red-500">{detailError}</p>
            ) : (
              detail && (
                <>
                  <div className="mb-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <p>
                      <strong>케어 대상:</strong> {detail.patientName}
                    </p>
                    <p>
                      <strong>통화 ID:</strong> {detail.callId}
                    </p>
                    <p>
                      <strong>통화 시간:</strong> {detail.startTime}
                    </p>
                    <p>
                      <strong>상태:</strong>{" "}
                      {detail.statusLabel || detail.status}
                    </p>
                    <p>
                      <strong>위험도:</strong>{" "}
                      <span className="inline-flex items-center gap-2">
                        {getRiskLevelDisplay(detail.riskLevel)}
                        <span className="text-xs text-gray-400">
                          ({detail.riskScore ?? 0}점)
                        </span>
                      </span>
                    </p>
                  </div>

                  <div className="mb-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700">AI 요약</p>
                    <p className="rounded border bg-gray-50 px-3 py-2 text-sm text-gray-800">
                      {detail.aiMemo ||
                        detail.summary ||
                        "요약 정보가 없습니다."}
                    </p>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700">
                      통화 전문
                    </p>
                    <div className="h-52 overflow-y-auto rounded border border-gray-200 bg-white p-3 text-sm leading-relaxed text-gray-800 whitespace-pre-line">
                      {detail.transcript || "통화 전문이 없습니다."}
                    </div>
                  </div>

                  {recordingUrl && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700">
                        녹취 파일
                      </p>
                      <audio
                        controls
                        src={recordingUrl}
                        className="w-full rounded border border-gray-200"
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                        <span className="font-medium text-gray-700">
                          {detail.recordingFileName}
                        </span>
                        <span>{formatFileSize(detail.recordingFileSize)}</span>
                        <span>
                          {detail.recordingContentType ?? "알 수 없는 형식"}
                        </span>
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch(recordingUrl);
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download =
                                detail.recordingFileName || "recording.mp3";
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                            } catch (error) {
                              console.error("Download failed", error);
                              alert("파일 다운로드에 실패했습니다.");
                            }
                          }}
                          className="rounded border border-[#008080] px-2 py-1 text-[#008080] transition hover:bg-[#008080] hover:text-white"
                        >
                          다운로드
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CallHistoryTab;
