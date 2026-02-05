import React from 'react';
import KPICard from './KPICard';
import LineChart from './LineChart';
import DoughnutChart from './DoughnutChart';
import BarChart from './BarChart';
import { mapRiskLevelKeysToLabels } from '../../utils/riskLevelStyles';

function OverviewTab({ statistics, formatNumber, formatPercent }) {
  const { summary, callStatistics, riskStatistics } = statistics;

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

  // 위험 레벨 분포
  const riskLevelData = riskStatistics?.riskLevelDistribution || {};
  const riskLevelLabels = mapRiskLevelKeysToLabels(Object.keys(riskLevelData));
  const riskLevelValues = Object.values(riskLevelData);
  const riskLevelColors = ['#10b981', '#f59e0b', '#ef4444', '#dc2626'];

  // 위험 시그널 Top 5
  const topRiskSignals = riskStatistics?.topRiskSignals?.slice(0, 5) || [];
  const riskSignalLabels = topRiskSignals.map(item => item.labelKr);
  const riskSignalValues = topRiskSignals.map(item => item.count);

  return (
    <>
      {/* KPI 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <KPICard
          title="총 통화 수"
          value={formatNumber(summary?.totalCalls)}
        />
        <KPICard
          title="통화 성공률"
          value={formatPercent(summary?.successRate)}
        />
        <KPICard
          title="평균 통화 시간"
          value={`${formatNumber(callStatistics?.avgDuration)}초`}
        />
        <KPICard
          title="위험 대상자"
          value={`${formatNumber(summary?.riskPatients)}명`}
        />
        <KPICard
          title="활성 알림"
          value={formatNumber(summary?.activeNotifications)}
        />
        <KPICard
          title="완료된 작업"
          value={formatNumber(summary?.completedTasks)}
        />
      </div>

      {/* 통계 차트 섹션 */}
      <div className="space-y-6">
        {/* 통화 성공률 추이 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">통화 성공률 추이</h2>
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

          {/* 위험 레벨 분포 */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">위험 레벨 분포</h2>
            <DoughnutChart
              data={riskLevelValues}
              labels={riskLevelLabels}
              colors={riskLevelColors}
            />
          </div>
        </div>

        {/* 위험 시그널 Top 5 */}
        {topRiskSignals.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">위험 시그널 Top 5</h2>
            <BarChart
              title="위험 시그널"
              data={riskSignalValues}
              labels={riskSignalLabels}
              colors="#ef4444"
            />
          </div>
        )}
      </div>
    </>
  );
}

export default OverviewTab;

