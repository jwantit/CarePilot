import React, { useEffect, useMemo, useState } from "react";
import { API_SERVER_HOST } from "../../api/apiClient";
import { getCallHistory, getCallDetail } from "../../api/callApi";

const CallHistoryTab = () => {
  const [history, setHistory] = useState([]);
  const [detail, setDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterTimeFrom, setFilterTimeFrom] = useState("");
  const [filterTimeTo, setFilterTimeTo] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterPatient, setFilterPatient] = useState("");
  const [filterResult, setFilterResult] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await getCallHistory();
        setHistory(res);
      } catch (error) {
        console.error("Failed to load call history", error);
      }
    };

    loadHistory();
  }, []);

  const openDetailModal = async (callId) => {
    setIsModalOpen(true);
    setDetail(null);
    setDetailError("");
    setIsDetailLoading(true);

    try {
      const callDetail = await getCallDetail(callId);
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

      return matchesFrom && matchesTo && matchesType && matchesPatient && matchesResult;
    });
  }, [
    history,
    filterTimeFrom,
    filterTimeTo,
    filterType,
    filterPatient,
    filterResult,
  ]);

  return (
    <div className="relative">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 rounded border border-gray-200 bg-white p-4 text-xs font-medium uppercase tracking-wide text-gray-500 shadow-sm">
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
        <div className="flex flex-col gap-1">
          <span>유형</span>
          <select
            className="h-9 min-w-[140px] rounded border border-gray-300 bg-white px-2 text-sm text-slate-700"
            value={filterType}
            onChange={(event) => setFilterType(event.target.value)}
          >
            <option value="">전체</option>
            <option value="수신">수신</option>
            <option value="발신">발신</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span>환자명</span>
          <input
            type="text"
            className="h-9 min-w-[200px] rounded border border-gray-300 px-2 text-sm text-slate-700"
            placeholder="이름 검색"
            value={filterPatient}
            onChange={(event) => setFilterPatient(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span>결과</span>
          <select
            className="h-9 min-w-[160px] rounded border border-gray-300 bg-white px-2 text-sm text-slate-700"
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
        <button
          type="button"
          onClick={() => {
            setFilterTimeFrom("");
            setFilterTimeTo("");
            setFilterType("");
            setFilterPatient("");
            setFilterResult("");
          }}
          className="h-9 rounded border border-[#008080] bg-[#008080] px-4 text-sm font-medium text-white transition hover:bg-[#006666]"
        >
          초기화
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100 text-left text-sm font-medium text-gray-700">
              <th className="px-3 py-2 border">시간</th>
              <th className="px-3 py-2 border">ID</th>
              <th className="px-3 py-2 border">환자명</th>
              <th className="px-3 py-2 border">유형</th>
              <th className="px-3 py-2 border">통화 시간</th>
              <th className="px-3 py-2 border">결과</th>
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
                  colSpan="7"
                >
                  표시할 통화 기록이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
                      <strong>통화 ID:</strong> {detail.callId}
                    </p>
                    <p>
                      <strong>통화 시간:</strong> {detail.startTime}
                    </p>
                    <p>
                      <strong>상태:</strong> {detail.statusLabel || detail.status}
                    </p>
                    <p>
                      <strong>위험도:</strong> {detail.riskLevel ?? "NONE"} (
                      {detail.riskScore ?? "-"})
                    </p>
                  </div>

                  <div className="mb-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700">AI 요약</p>
                    <p className="rounded border bg-gray-50 px-3 py-2 text-sm text-gray-800">
                      {detail.aiMemo || detail.summary || "요약 정보가 없습니다."}
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
                        <a
                          href={recordingUrl}
                          download={detail.recordingFileName || ""}
                          className="rounded border border-[#008080] px-2 py-1 text-[#008080] transition hover:bg-[#008080] hover:text-white"
                        >
                          다운로드
                        </a>
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
