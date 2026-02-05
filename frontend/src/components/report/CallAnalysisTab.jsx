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

  // 통화 상태 분포 (성공=초록, 무응답=회색, 실패=빨강, 취소=주황)
  const callStatusData = callStatistics?.statusDistribution || {};
  const callStatusOrder = ['SUCCESS', 'NO_ANSWER', 'FAILED', 'CANCELLED'];
  const callStatusColorMap = {
    SUCCESS: '#10b981',
    NO_ANSWER: '#64748b',
    FAILED: '#ef4444',
    CANCELLED: '#f59e0b',
  };
  const callStatusMap = {
    'CANCELLED': '취소',
    'SUCCESS': '성공',
    'FAILED': '실패',
    'NO_ANSWER': '무응답'
  };

  // 키가 한글로 오는 경우를 고려한 처리
  const rawStatusKeys = Object.keys(callStatusData);
  const getMappedStatusKey = (key) => {
    if (key === '성공') return 'SUCCESS';
    if (key === '무응답') return 'NO_ANSWER';
    if (key === '실패') return 'FAILED';
    if (key === '취소' || key === '취소됨') return 'CANCELLED';
    return key;
  };

  const processedStatusData = {};
  rawStatusKeys.forEach(key => {
    const mappedKey = getMappedStatusKey(key);
    processedStatusData[mappedKey] = (processedStatusData[mappedKey] || 0) + callStatusData[key];
  });

  const callStatusKeys = callStatusOrder.filter(k => processedStatusData[k] != null);
  const callStatusLabels = callStatusKeys.map(key => callStatusMap[key] || key);
  const callStatusValues = callStatusKeys.map(key => processedStatusData[key]);
  const callStatusColors = callStatusKeys.map(key => callStatusColorMap[key] || '#94a3b8');

  // 통화 실패 원인 분포 (취소=주황, 실패=빨강, 무응답=회색)
  const failureReasonData = callStatistics?.failureReasonDistribution || {};
  const failureReasonOrder = ['CANCELLED', 'FAILED', 'NO_ANSWER'];
  const failureReasonColorMap = {
    CANCELLED: '#f59e0b',
    FAILED: '#ef4444',
    NO_ANSWER: '#64748b',
  };
  const failureReasonMap = {
    'CANCELLED': '취소',
    'FAILED': '실패',
    'NO_ANSWER': '무응답'
  };

  // 키가 한글("취소됨" 등)로 오는 경우를 고려한 처리
  const rawKeys = Object.keys(failureReasonData);
  const getMappedKey = (key) => {
    if (key === '취소됨' || key === '취소') return 'CANCELLED';
    if (key === '실패') return 'FAILED';
    if (key === '무응답') return 'NO_ANSWER';
    return key;
  };

  const processedData = {};
  rawKeys.forEach(key => {
    const mappedKey = getMappedKey(key);
    processedData[mappedKey] = (processedData[mappedKey] || 0) + failureReasonData[key];
  });

  const failureReasonKeys = failureReasonOrder.filter(k => processedData[k] != null);
  const failureReasonLabels = failureReasonKeys.map(key => failureReasonMap[key] || key);
  const failureReasonValues = failureReasonKeys.map(key => processedData[key]);
  const failureReasonColors = failureReasonKeys.map(key => failureReasonColorMap[key] || '#94a3b8');

  // 시간대별 통화 분포
  const timeSlotData = callStatistics?.timeSlotDistribution || {};
  const timeSlotLabels = Object.keys(timeSlotData).sort((a, b) => Number(a) - Number(b)).map(hour => `${hour}시`);
  const timeSlotValues = Object.keys(timeSlotData).sort((a, b) => Number(a) - Number(b)).map(hour => timeSlotData[hour]);

  return (
    <div className="space-y-6">
      {/* 통화 추이 */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-none shadow-lg p-6">
        <h2 className="text-xl font-bold text-slate-100 mb-4">통화 추이</h2>
        <LineChart
          labels={callTrendLabels}
          datasets={callTrendDatasets}
        />
      </div>

      {/* 통계 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 통화 상태 분포 */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-none shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-100 mb-4">통화 상태 분포</h2>
          <DoughnutChart
            data={callStatusValues}
            labels={callStatusLabels}
            colors={callStatusColors}
          />
        </div>

        {/* 통화 실패 원인 분석 */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-none shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-100 mb-4">통화 실패 원인 분석</h2>
          {failureReasonLabels.length > 0 ? (
            <DoughnutChart
              data={failureReasonValues}
              labels={failureReasonLabels}
              colors={failureReasonColors}
            />
          ) : (
            <div className="text-center text-slate-500 py-8">
              실패한 통화가 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 시간대별 통화 현황 */}
      {timeSlotLabels.length > 0 && (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-none shadow-lg p-6">
        <h2 className="text-xl font-bold text-slate-100 mb-4">시간대별 통화 현황</h2>
          <BarChart
            title="시간대별 통화 건수"
            data={timeSlotValues}
            labels={timeSlotLabels}
            colors="#008080"
          />
        </div>
      )}
    </div>
  );
}

export default CallAnalysisTab;

