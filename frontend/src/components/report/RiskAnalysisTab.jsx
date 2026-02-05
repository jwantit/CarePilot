import React from 'react';
import LineChart from './LineChart';
import DoughnutChart from './DoughnutChart';
import BarChart from './BarChart';
import { mapRiskLevelKeysToLabels } from '../../utils/riskLevelStyles';

function RiskAnalysisTab({ statistics }) {
  const { riskStatistics } = statistics;

  // 위험 점수 추이 데이터
  const riskScoreTrendData = riskStatistics?.riskScoreTrend || [];
  const riskScoreTrendLabels = riskScoreTrendData.map(item => {
    const date = new Date(item.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
  const riskScoreTrendDatasets = [{
    label: '평균 위험 점수',
    data: riskScoreTrendData.map(item => item.avgRiskScore),
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    fill: true,
  }];

  // 위험 레벨 분포 (긴급/위험/보통/낮음 - 기존 색상)
  const riskLevelData = riskStatistics?.riskLevelDistribution || {};
  const riskLevelOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const riskLevelColorsByKey = {
    CRITICAL: '#dc2626',
    HIGH: '#ea580c',
    MEDIUM: '#eab308',
    LOW: '#10b981',
  };
  const riskLevelKeys = riskLevelOrder.filter(k => riskLevelData[k] != null);
  const riskLevelLabels = mapRiskLevelKeysToLabels(riskLevelKeys);
  const riskLevelValues = riskLevelKeys.map(k => riskLevelData[k]);
  const riskLevelColors = riskLevelKeys.map(k => riskLevelColorsByKey[k] || '#94a3b8');

  // 위험 시그널 Top 5
  const topRiskSignals = riskStatistics?.topRiskSignals?.slice(0, 5) || [];
  const riskSignalLabels = topRiskSignals.map(item => item.labelKr);
  const riskSignalValues = topRiskSignals.map(item => item.count);

  return (
    <div className="space-y-6">
      {/* 위험 점수 추이 */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-none shadow-lg p-6">
        <h2 className="text-xl font-bold text-slate-100 mb-4">위험 점수 추이</h2>
        <LineChart
          labels={riskScoreTrendLabels}
          datasets={riskScoreTrendDatasets}
        />
      </div>

      {/* 위험 레벨 분포 */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-none shadow-lg p-6">
        <h2 className="text-xl font-bold text-slate-100 mb-4">위험 레벨 분포</h2>
        <DoughnutChart
          data={riskLevelValues}
          labels={riskLevelLabels}
          colors={riskLevelColors}
        />
      </div>

        {/* 위험 시그널 분석 */}
        {topRiskSignals.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-none shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-100 mb-4">위험 시그널 분석</h2>
          <BarChart
            title="위험 시그널"
            data={riskSignalValues}
            labels={riskSignalLabels}
            colors="#ef4444"
          />
        </div>
      )}

      {/* 평균 위험 점수 카드 */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-none shadow-lg p-6">
        <h2 className="text-xl font-bold text-slate-100 mb-4">평균 위험 점수</h2>
        <div className="text-4xl font-bold text-teal-400">
          {riskStatistics?.avgRiskScore?.toFixed(2) || '0.00'}
        </div>
      </div>
    </div>
  );
}

export default RiskAnalysisTab;

