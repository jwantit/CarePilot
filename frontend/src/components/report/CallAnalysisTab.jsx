import React from 'react';
import LineChart from './LineChart';
import DoughnutChart from './DoughnutChart';
import BarChart from './BarChart';

function CallAnalysisTab({ statistics }) {
  const { callStatistics } = statistics;

  // 통화 추이 차트 데이터
  const callTrendData = callStatistics?.trend || [];
  const callTrendLabels = callTrendData.map(item => {
    const date = new Date(item.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
  const callTrendDatasets = [
    {
      label: '총 통화',
      data: callTrendData.map(item => item.total),
      borderColor: '#008080',
      backgroundColor: 'rgba(0, 128, 128, 0.1)',
      fill: true,
    },
    {
      label: '성공',
      data: callTrendData.map(item => item.success),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
    },
  ];

  // 통화 상태 분포
  const callStatusData = callStatistics?.statusDistribution || {};
  
  // 통화 상태 한국어 매핑
  const callStatusMap = {
    'CANCELLED': '취소',
    'SUCCESS': '성공',
    'FAILED': '실패',
    'NO_ANSWER': '무응답'
  };
  
  // 한국어 라벨로 변환
  const callStatusLabels = Object.keys(callStatusData).map(key => callStatusMap[key] || key);
  const callStatusValues = Object.values(callStatusData);

  // 통화 실패 원인 분포
  const failureReasonData = callStatistics?.failureReasonDistribution || {};
  const failureReasonLabels = Object.keys(failureReasonData);
  const failureReasonValues = Object.values(failureReasonData);

  // 시간대별 통화 분포
  const timeSlotData = callStatistics?.timeSlotDistribution || {};
  const timeSlotLabels = Object.keys(timeSlotData).sort((a, b) => Number(a) - Number(b)).map(hour => `${hour}시`);
  const timeSlotValues = Object.keys(timeSlotData).sort((a, b) => Number(a) - Number(b)).map(hour => timeSlotData[hour]);

  return (
    <div className="space-y-6">
      {/* 통화 추이 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">통화 추이</h2>
        <LineChart
          labels={callTrendLabels}
          datasets={callTrendDatasets}
        />
      </div>

      {/* 통계 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 통화 상태 분포 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">통화 상태 분포</h2>
          <DoughnutChart
            data={callStatusValues}
            labels={callStatusLabels}
          />
        </div>

        {/* 통화 실패 원인 분석 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">통화 실패 원인 분석</h2>
          {failureReasonLabels.length > 0 ? (
            <DoughnutChart
              data={failureReasonValues}
              labels={failureReasonLabels}
            />
          ) : (
            <div className="text-center text-gray-500 py-8">
              실패한 통화가 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 시간대별 통화 현황 */}
      {timeSlotLabels.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">시간대별 통화 현황</h2>
          <BarChart
            title="시간대별 통화 건수"
            data={timeSlotValues}
            labels={timeSlotLabels}
            colors="#008080"
          />
        </div>
      )}

      {/* 평균 통화 시간 카드 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">평균 통화 시간</h2>
        <div className="text-4xl font-bold text-[#008080]">
          {callStatistics?.avgDuration?.toFixed(1) || '0.0'}초
        </div>
      </div>
    </div>
  );
}

export default CallAnalysisTab;

