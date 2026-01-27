import React from "react";

const CallDetailView = ({ detail, loading }) => {
  if (loading)
    return <div className="p-10 text-center">데이터를 불러오는 중...</div>;
  if (!detail)
    return (
      <div className="p-10 text-center text-gray-400">
        통화 내역을 선택하면 상세 분석 내용이 표시됩니다.
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-white border rounded-lg overflow-hidden shadow-sm">
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h3 className="font-bold text-lg text-gray-800">통화 상세 분석</h3>
        <span className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded">
          AI 분석 완료
        </span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {/* STT 대화 로그 섹션 */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-500 mb-2 uppercase">
            STT 대화 기록
          </h4>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm min-h-[200px] whitespace-pre-line leading-relaxed">
            {detail.transcript || "대화 기록이 없습니다."}
          </div>
        </div>

        {/* AI 요약 섹션 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-500 mb-2 uppercase">
            AI 요약 및 메모
          </h4>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-gray-700">
              {detail.summary || "분석된 요약 내용이 없습니다."}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 border-t bg-gray-50 text-right">
        <button className="text-sm text-[#008080] hover:text-[#006666] hover:underline font-medium transition">
          상세 보고서 다운로드
        </button>
      </div>
    </div>
  );
};

export default CallDetailView;
