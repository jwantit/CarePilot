import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { API_SERVER_HOST } from "../../api/apiClient";
import { getCallHistoryWithPaging, getCallDetail } from "../../api/callApi";
import { useAuth } from "../../hooks/useAuth";
import Loading from "../common/Loading";
import {
  getRiskLevelLabel,
  getRiskLevelStyle,
} from "../../utils/riskLevelStyles";

const CallHistoryTab = () => {
  const { user } = useAuth();
  const organizationId = user?.organizationId;
  const [searchParams, setSearchParams] = useSearchParams();
  // URL 파라미터에서 페이지 읽기, 없으면 기본값 1
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const [isListLoading, setIsListLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [pageData, setPageData] = useState({
    page: 1,
    size: 20,
    total: 0,
    start: 1,
    end: 1,
    prev: false,
    next: false,
  });
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

  // URL 파라미터 읽기
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  // URL 파라미터로부터 필터 초기화
  useEffect(() => {
    if (dateFrom && dateTo) {
      setFilterTimeFrom(dateFrom);
      setFilterTimeTo(dateTo);
    } else {
      // 파라미터가 없으면 빈 문자열로 초기화
      setFilterTimeFrom('');
      setFilterTimeTo('');
    }
  }, [dateFrom, dateTo]);
// 까지 URL 파라미터 로직, 통화 0건 클릭 시 오늘로 필터해서 데이터 검색
  useEffect(() => {
    const loadHistory = async () => {
      if (!organizationId) return;
      try {
        setIsListLoading(true);
        const res = await getCallHistoryWithPaging(
          organizationId,
          currentPage,
          20,
        );
        setHistory(res.dtoList || []);
        setPageData({
          page: res.page || 1,
          size: res.size || 20,
          total: res.total || 0,
          start: res.start || 1,
          end: res.end || 1,
          prev: res.prev || false,
          next: res.next || false,
        });
      } catch (error) {
        console.error("통화 이력 로드 실패:", error);
        setHistory([]);
      } finally {
        setIsListLoading(false);
      }
    };

    loadHistory();
  }, [organizationId, currentPage]);

  // 페이지 변경 함수
  const handlePageChange = (page) => {
    // tab 파라미터 유지하면서 page만 업데이트
    const tab = searchParams.get("tab") || "history";
    setSearchParams({ tab, page: page.toString() });
  };

  const getRiskLevelDisplay = (riskLevel) => {
    const displayLevel = riskLevel || "LOW";
    return (
      <div className="flex justify-center items-center">
        <span
          className={`inline-flex justify-center px-4 py-1.5 rounded-sm text-sm font-bold border shadow-sm ${getRiskLevelStyle(displayLevel)}`}
        >
          {getRiskLevelLabel(displayLevel)}
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
    let to = parseDateTime(filterTimeTo);

    // YYYY-MM-DD 형식일 경우 해당 날짜의 23:59:59까지 포함하도록 설정
    if (to && filterTimeTo.length === 10) {
      to = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999);
    }

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
    <div className="relative space-y-6">
      {isListLoading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-none border border-cp-border bg-cp-bg/50">
          <Loading />
        </div>
      ) : (
        <>
          {/* 필터 바 */}
          <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border p-5 mb-2 space-y-4 shadow-lg">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-cp-muted uppercase tracking-wider">
                  시간
                </span>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="h-9 w-[150px] rounded border border-cp-border bg-cp-input px-2 text-sm text-cp-text focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
                    value={filterTimeFrom}
                    onChange={(e) => setFilterTimeFrom(e.target.value)}
                  />
                  <input
                    type="date"
                    className="h-9 w-[150px] rounded border border-cp-border bg-cp-input px-2 text-sm text-cp-text focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
                    value={filterTimeTo}
                    onChange={(e) => setFilterTimeTo(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-cp-muted uppercase tracking-wider">
                  유형
                </span>
                <select
                  className="h-9 min-w-[100px] rounded border border-cp-border bg-cp-input px-2 text-sm text-cp-text focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">전체</option>
                  <option value="수신">수신</option>
                  <option value="발신">발신</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-cp-muted uppercase tracking-wider">
                  케어 대상
                </span>
                <input
                  type="text"
                  className="h-9 min-w-[140px] rounded border border-cp-border bg-cp-input px-2 text-sm text-cp-text placeholder:text-cp-muted focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
                  placeholder="이름 검색"
                  value={filterPatient}
                  onChange={(e) => setFilterPatient(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-cp-muted uppercase tracking-wider">
                  결과
                </span>
                <select
                  className="h-9 min-w-[110px] rounded border border-cp-border bg-cp-input px-2 text-sm text-cp-text focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
                  value={filterResult}
                  onChange={(e) => setFilterResult(e.target.value)}
                >
                  <option value="">전체</option>
                  <option value="성공">성공</option>
                  <option value="실패">실패</option>
                  <option value="무응답">무응답</option>
                  <option value="취소됨">취소됨</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-cp-muted uppercase tracking-wider">
                  위험도
                </span>
                <select
                  className="h-9 min-w-[110px] rounded border border-cp-border bg-cp-input px-2 text-sm text-cp-text focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none"
                  value={filterRiskLevel}
                  onChange={(e) => setFilterRiskLevel(e.target.value)}
                >
                  <option value="">전체</option>
                  <option value="LOW">낮음</option>
                  <option value="MEDIUM">보통</option>
                  <option value="HIGH">위험</option>
                  <option value="CRITICAL">긴급</option>
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
                className="h-9 flex items-center gap-1.5 px-4 bg-cp-input hover:bg-cp-bg text-cp-muted text-sm font-semibold border border-cp-border hover:border-cp-border hover:text-cp-text transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                초기화
              </button>
            </div>
          </div>

          {/* 테이블 */}
          <div className="bg-cp-card border border-cp-border rounded-sm overflow-hidden">
            <table className="w-full text-center">
              <thead className="bg-cp-header text-white dark:text-cp-muted uppercase text-sm border-b-2 border-teal-500/30">
                <tr>
                  <th className="px-3 py-3 text-white dark:text-teal-400">콜 ID</th>
                  <th className="px-3 py-3 text-white dark:text-teal-400">시간</th>
                  <th className="px-3 py-3 text-white dark:text-teal-400">케어 대상</th>
                  <th className="px-3 py-3 text-white dark:text-teal-400">유형</th>
                  <th className="px-3 py-3 text-white dark:text-teal-400">통화 시간</th>
                  <th className="px-3 py-3 text-white dark:text-teal-400">결과</th>
                  <th className="px-3 py-3 text-white dark:text-teal-400">
                    위험도 (점수)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cp-border">
                {filteredHistory.map((item) => (
                  <tr
                    key={item.callId}
                    onClick={() => openDetailModal(item.callId)}
                    className="hover:bg-cp-bg/50 transition bg-cp-card/30 cursor-pointer"
                  >
                    <td className="px-3 py-4 text-base text-cp-text">
                      {item.callId}
                    </td>
                    <td className="px-3 py-4 text-base text-cp-text">
                      {item.startTime}
                    </td>
                    <td className="px-3 py-4 text-base text-cp-text">
                      {item.careTargetName}
                    </td>
                    <td className="px-3 py-4 text-base text-cp-text">
                      {item.direction}
                    </td>
                    <td className="px-3 py-4 text-base text-cp-text">
                      {item.duration}
                    </td>
                    <td className="px-3 py-4 text-base text-cp-text">
                      {item.statusLabel || item.status}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {getRiskLevelDisplay(item.riskLevel)}
                        <span className="text-cp-muted text-sm min-w-[45px]">
                          ({item.riskScore ?? 0}점)
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredHistory.length === 0 && (
                  <tr>
                    <td
                      className="px-3 py-10 text-center text-base text-cp-muted"
                      colSpan={7}
                    >
                      표시할 통화 기록이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* 페이징 */}
          {pageData.total > 0 && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={!pageData.prev}
                className={`px-3 py-1.5 rounded border text-sm font-medium ${
                  !pageData.prev
                    ? "bg-cp-bg text-cp-muted border-cp-border cursor-not-allowed"
                    : "bg-cp-input text-cp-text border-cp-border hover:bg-cp-bg"
                }`}
              >
                처음
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pageData.prev}
                className={`px-3 py-1.5 rounded border text-sm font-medium ${
                  !pageData.prev
                    ? "bg-cp-bg text-cp-muted border-cp-border cursor-not-allowed"
                    : "bg-cp-input text-cp-text border-cp-border hover:bg-cp-bg"
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
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1.5 rounded border text-sm font-medium ${
                    pageNum === currentPage
                      ? "bg-teal-600 text-white border-teal-500"
                      : "bg-cp-input text-cp-text border-cp-border hover:bg-cp-bg"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pageData.next}
                className={`px-3 py-1.5 rounded border text-sm font-medium ${
                  !pageData.next
                    ? "bg-cp-bg text-cp-muted border-cp-border cursor-not-allowed"
                    : "bg-cp-input text-cp-text border-cp-border hover:bg-cp-bg"
                }`}
              >
                다음
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(pageData.end)}
                disabled={!pageData.next}
                className={`px-3 py-1.5 rounded border text-sm font-medium ${
                  !pageData.next
                    ? "bg-cp-bg text-cp-muted border-cp-border cursor-not-allowed"
                    : "bg-cp-input text-cp-text border-cp-border hover:bg-cp-bg"
                }`}
              >
                마지막
              </button>
            </div>
          )}
        </>
      )}

      {/* 상세 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-none border border-cp-border bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-cp-text">
                통화 상세
              </h3>
              <button
                type="button"
                className="text-cp-muted hover:text-cp-text text-sm font-medium"
                onClick={closeModal}
              >
                닫기
              </button>
            </div>

            {isDetailLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loading />
              </div>
            ) : detailError ? (
              <p className="text-sm text-red-400">{detailError}</p>
            ) : (
              detail && (
                <>
                  <div className="mb-4 grid grid-cols-2 gap-4 text-sm text-cp-text">
                    <p>
                      <strong className="text-cp-muted">케어 대상:</strong>{" "}
                      {detail.patientName ?? detail.careTargetName}
                    </p>
                    <p>
                      <strong className="text-cp-muted">통화 ID:</strong>{" "}
                      {detail.callId}
                    </p>
                    <p>
                      <strong className="text-cp-muted">통화 시간:</strong>{" "}
                      {detail.startTime}
                    </p>
                    {detail.endTime && (
                      <p>
                        <strong className="text-slate-400">통화 종료:</strong>{" "}
                        {detail.endTime}
                      </p>
                    )}
                    <p>
                      <strong className="text-slate-400">통화 시간:</strong>{" "}
                      {detail.duration != null && detail.duration > 0
                        ? `${Math.floor(detail.duration / 60)}분 ${detail.duration % 60}초`
                        : "-"}
                    </p>
                    <p>
                      <strong className="text-cp-muted">상태:</strong>{" "}
                      {detail.statusLabel || detail.status}
                    </p>
                    <p>
                      <strong className="text-cp-muted">위험도:</strong>{" "}
                      <span className="inline-flex items-center gap-2">
                        {getRiskLevelDisplay(detail.riskLevel)}
                        <span className="text-xs text-cp-muted">
                          ({detail.riskScore ?? 0}점)
                        </span>
                      </span>
                    </p>
                  </div>

                  <div className="mb-4 space-y-2">
                    <p className="text-sm font-medium text-cp-muted">
                      AI 요약
                    </p>
                    <p className="rounded border border-cp-border bg-cp-bg/50 px-3 py-2 text-sm text-cp-text">
                      {detail.aiMemo ||
                        detail.summary ||
                        "요약 정보가 없습니다."}
                    </p>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-cp-muted">
                      통화 전문
                    </p>
                    <div className="h-52 overflow-y-auto rounded border border-cp-border bg-cp-bg/50 p-3 text-sm leading-relaxed text-cp-text whitespace-pre-line">
                      {detail.transcript || "통화 전문이 없습니다."}
                    </div>
                  </div>

                  {recordingUrl && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-cp-muted">
                        녹취 파일
                      </p>
                      <audio
                        controls
                        src={recordingUrl}
                        className="audio-dark w-full rounded border border-cp-border bg-cp-bg"
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-cp-muted">
                        <span className="font-medium text-cp-text">
                          {detail.recordingFileName}
                        </span>
                        <span>{formatFileSize(detail.recordingFileSize)}</span>
                        <span>
                          {detail.recordingContentType ?? "알 수 없는 형식"}
                        </span>
                        <button
                          type="button"
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
                            } catch (err) {
                              console.error("Download failed", err);
                              alert("파일 다운로드에 실패했습니다.");
                            }
                          }}
                          className="rounded border border-teal-500/50 px-2 py-1 text-teal-400 hover:bg-teal-500/20 transition"
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
