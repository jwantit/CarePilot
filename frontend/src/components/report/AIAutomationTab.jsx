import React from 'react';
import KPICard from './KPICard';
import DoughnutChart from './DoughnutChart';
import BarChart from './BarChart';

function AIAutomationTab({ statistics, formatNumber, formatPercent }) {
  const { taskStatistics } = statistics;

  // AI vs USER 작업 분포 (UNKNOWN 제외)
  const sourceTypeData = taskStatistics?.sourceTypeDistribution || {};
  const sourceTypeEntries = Object.entries(sourceTypeData).filter(([key]) => key !== 'UNKNOWN');
  
  const sourceTypeLabels = sourceTypeEntries.map(([key]) => {
    const labels = {
      'AI': 'AI 작업',
      'USER': '사용자 작업'
    };
    return labels[key] || key;
  });
  const sourceTypeValues = sourceTypeEntries.map(([, value]) => value);
  
  // AI와 USER 순서에 맞게 색상 매핑
  const sourceTypeColors = sourceTypeEntries.map(([key]) => {
    return key === 'AI' ? '#008080' : '#94a3b8';
  });

  // AI 작업 통계
  const totalAiTasks = taskStatistics?.totalAiTasks || 0;
  const successfulAiTasks = taskStatistics?.successfulAiTasks || 0;
  const failedAiTasks = taskStatistics?.failedAiTasks || 0;
  const aiSuccessRate = taskStatistics?.aiSuccessRate || 0;

  // AI 작업 타입별 분포
  const aiTaskTypeData = taskStatistics?.aiTaskTypeDistribution || {};
  const aiTaskTypeLabels = Object.keys(aiTaskTypeData).map(key => {
    const labels = {
      'SCHEDULE_CHANGE': '스케줄 변경',
      'NOTICE_CREATE': '공지사항 작성',
      'CARETARGET_UPDATE': '케어 대상 수정',
      'CALL_INIT': '전화 발신',
      'RISK_ALERT': '위험 알림',
      'AUTOMATION': '자동화 업무',
      'RISK_FOLLOWUP': '위험 후속조치',
      'CARE': '케어 관리',
      'OTHER': '기타'
    };
    return labels[key] || key;
  });
  const aiTaskTypeValues = Object.values(aiTaskTypeData);

  // AI 작업 상태별 분포
  const aiTaskStatusData = taskStatistics?.aiTaskStatusDistribution || {};
  const aiTaskStatusEntries = Object.entries(aiTaskStatusData);
  
  const aiTaskStatusLabels = aiTaskStatusEntries.map(([key]) => {
    const labels = {
      'SUCCESS': '성공',
      'FAILED': '실패',
      'WAITING': '대기'
    };
    return labels[key] || key;
  });
  const aiTaskStatusValues = aiTaskStatusEntries.map(([, value]) => value);
  
  // 상태에 맞는 색상 매핑
  const aiTaskStatusColors = aiTaskStatusEntries.map(([key]) => {
    const colorMap = {
      'SUCCESS': '#10b981',  // 초록색
      'FAILED': '#ef4444',   // 빨간색
      'WAITING': '#f59e0b'   // 노란색
    };
    return colorMap[key] || '#94a3b8';
  });

  return (
    <>
      {/* KPI 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          title="총 AI 작업 수"
          value={formatNumber(totalAiTasks)}
        />
        <KPICard
          title="AI 작업 성공률"
          value={formatPercent(aiSuccessRate)}
        />
        <KPICard
          title="성공한 AI 작업"
          value={formatNumber(successfulAiTasks)}
        />
        <KPICard
          title="실패한 AI 작업"
          value={formatNumber(failedAiTasks)}
        />
      </div>

      {/* 통계 차트 섹션 */}
      <div className="space-y-6">
        {/* 통계 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI vs USER 작업 분포 */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-none shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-100 mb-4">AI vs 사용자 작업 분포</h2>
            {sourceTypeLabels.length > 0 ? (
              <DoughnutChart
                data={sourceTypeValues}
                labels={sourceTypeLabels}
                colors={sourceTypeColors}
              />
            ) : (
              <div className="text-center text-slate-500 py-8">
                작업 데이터가 없습니다.
              </div>
            )}
          </div>

          {/* AI 작업 상태별 분포 */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-none shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-100 mb-4">AI 작업 상태별 분포</h2>
            {aiTaskStatusLabels.length > 0 ? (
              <DoughnutChart
                data={aiTaskStatusValues}
                labels={aiTaskStatusLabels}
                colors={aiTaskStatusColors}
              />
            ) : (
              <div className="text-center text-slate-500 py-8">
                AI 작업 데이터가 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* AI 작업 타입별 분포 */}
        {aiTaskTypeLabels.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-none shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-100 mb-4">AI 작업 타입별 분포</h2>
            <BarChart
              title="AI 작업 타입"
              data={aiTaskTypeValues}
              labels={aiTaskTypeLabels}
              colors="#008080"
            />
          </div>
        )}
      </div>
    </>
  );
}

export default AIAutomationTab;

