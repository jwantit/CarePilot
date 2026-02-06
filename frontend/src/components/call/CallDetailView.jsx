import React from "react";

const CallDetailView = ({ detail, loading }) => {
  if (loading)
    return <div className="p-10 text-center text-cp-muted">데이터를 불러오는 중...</div>;
  if (!detail)
    return (
      <div className="p-10 text-center text-cp-muted">
        통화 내역을 선택하면 상세 분석 내용이 표시됩니다.
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-cp-card border border-cp-border rounded-none overflow-hidden shadow-sm">
      <div className="p-4 border-b border-cp-border bg-cp-bg/50 flex justify-between items-center">
        <h3 className="font-bold text-lg text-cp-text">통화 상세 분석</h3>
        <span className="text-sm px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
          AI 분석 완료
        </span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-cp-bg/50">
        {/* STT 대화 로그 섹션 */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-cp-muted mb-2 uppercase">
            STT 대화 기록
          </h4>
          <div className="bg-cp-card p-4 rounded-none border border-cp-border shadow-sm min-h-[200px] whitespace-pre-line leading-relaxed text-cp-text">
            {detail.transcript || "대화 기록이 없습니다."}
          </div>
        </div>

        {/* AI 요약 섹션 */}
        <div>
          <h4 className="text-sm font-semibold text-cp-muted mb-2 uppercase">
            AI 요약 및 메모
          </h4>
          <div className="bg-blue-500/10 p-4 rounded-none border border-blue-500/20">
            <p className="text-cp-text">
              {detail.summary || "분석된 요약 내용이 없습니다."}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-cp-border bg-cp-bg/50 text-right">
        <button className="text-sm text-teal-400 hover:text-teal-300 hover:underline font-medium transition">
          상세 보고서 다운로드
        </button>
      </div>
    </div>
  );
};

export default CallDetailView;
