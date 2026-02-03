import React, { useState, useEffect } from 'react';
import { getStatistics, getDiseaseList } from '../../api/reportApi';
import { getCareGroupList } from '../../api/caretarget/careTargetGroupApi';
import { useAuth } from '../../hooks/useAuth';
import KPICard from '../../components/report/KPICard';
import LineChart from '../../components/report/LineChart';
import DoughnutChart from '../../components/report/DoughnutChart';
import BarChart from '../../components/report/BarChart';

function ReportPage() {
  const { user } = useAuth();
  const organizationId = user?.organizationId;
  
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('month'); // 'today', 'week', 'month', 'custom'
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedDisease, setSelectedDisease] = useState('');
  const [groups, setGroups] = useState([]);
  const [diseases, setDiseases] = useState([]);

  // 그룹 목록과 질환 목록 로드
  useEffect(() => {
    if (organizationId) {
      loadGroups();
      loadDiseases();
    }
  }, [organizationId]);

  // dateRange가 변경될 때 'custom'이 아니면 날짜 초기화
  useEffect(() => {
    if (dateRange !== 'custom') {
      setStartDate(null);
      setEndDate(null);
    }
  }, [dateRange]);

  useEffect(() => {
    loadStatistics();
  }, [dateRange, startDate, endDate, selectedGroupId, selectedDisease]);

  const loadGroups = async () => {
    try {
      const data = await getCareGroupList(organizationId);
      setGroups(data || []);
    } catch (err) {
      console.error('그룹 목록 로딩 실패:', err);
    }
  };

  const loadDiseases = async () => {
    try {
      const data = await getDiseaseList();
      setDiseases(data || []);
    } catch (err) {
      console.error('질환 목록 로딩 실패:', err);
    }
  };

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      let start = startDate;
      let end = endDate;

      // 기본 기간 설정
      // dateRange가 'custom'이 아니면 startDate와 endDate를 무시하고 dateRange에 따라 설정
      if (dateRange !== 'custom') {
        const now = new Date();
        switch (dateRange) {
          case 'today':
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            break;
          case 'week':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            end = new Date(weekStart);
            end.setDate(weekStart.getDate() + 7);
            start = weekStart;
            break;
          case 'month':
          default:
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            break;
        }
      } else if (!start || !end) {
        // 'custom'인데 날짜가 설정되지 않은 경우 기본값 사용
        const now = new Date();
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      }

      // 년월일 시분초 형식으로 변환 (yyyy-MM-dd HH:mm:ss)
      const formatDateTime = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };

      const startFormatted = formatDateTime(start);
      const endFormatted = formatDateTime(end);

      const data = await getStatistics(
        startFormatted, 
        endFormatted, 
        selectedGroupId, 
        selectedDisease || null
      );
      setStatistics(data);
    } catch (err) {
      console.error('통계 데이터 로딩 실패:', err);
      setError('통계 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString();
  };

  const formatPercent = (num) => {
    if (num === null || num === undefined) return '0';
    return `${num.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  const { summary, callStatistics, riskStatistics, taskStatistics } = statistics;

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
  const callStatusLabels = Object.keys(callStatusData);
  const callStatusValues = Object.values(callStatusData);

  // 위험 레벨 분포
  const riskLevelData = riskStatistics?.riskLevelDistribution || {};
  const riskLevelLabels = Object.keys(riskLevelData).map(key => {
    const labels = {
      'LOW': '일반',
      'MEDIUM': '주의',
      'HIGH': '위험',
      'CRITICAL': '긴급'
    };
    return labels[key] || key;
  });
  const riskLevelValues = Object.values(riskLevelData);
  const riskLevelColors = ['#10b981', '#f59e0b', '#ef4444', '#dc2626'];

  // 위험 시그널 Top 5
  const topRiskSignals = riskStatistics?.topRiskSignals?.slice(0, 5) || [];
  const riskSignalLabels = topRiskSignals.map(item => item.labelKr);
  const riskSignalValues = topRiskSignals.map(item => item.count);

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">통계 및 보고서</h1>
        <p className="text-gray-500">시스템 운영 현황과 데이터 분석을 확인하세요.</p>
        
        {/* 기간 선택 */}
        <div className="mt-4 flex items-center gap-2">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              dateRange === 'today'
                ? 'bg-[#008080] text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setDateRange('today')}
          >
            오늘
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              dateRange === 'week'
                ? 'bg-[#008080] text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setDateRange('week')}
          >
            이번 주
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              dateRange === 'month'
                ? 'bg-[#008080] text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setDateRange('month')}
          >
            이번 달
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              dateRange === 'custom'
                ? 'bg-[#008080] text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setDateRange('custom')}
          >
            직접 선택
          </button>
        </div>

        {dateRange === 'custom' && (
          <div className="mt-4 flex items-center gap-2">
            <input
              type="date"
              className="px-4 py-2 border border-gray-300 rounded-lg"
              value={startDate ? startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setStartDate(new Date(e.target.value))}
            />
            <span className="text-gray-500">~</span>
            <input
              type="date"
              className="px-4 py-2 border border-gray-300 rounded-lg"
              value={endDate ? endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setEndDate(new Date(e.target.value))}
            />
          </div>
        )}

        {/* 필터 선택 */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">그룹:</label>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700"
              value={selectedGroupId || ''}
              onChange={(e) => setSelectedGroupId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">전체</option>
              {groups.map((group) => (
                <option key={group.groupId} value={group.groupId}>
                  {group.groupName}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">질환:</label>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700"
              value={selectedDisease}
              onChange={(e) => setSelectedDisease(e.target.value)}
            >
              <option value="">전체</option>
              {diseases.map((disease) => (
                <option key={disease} value={disease}>
                  {disease}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <KPICard
          title="총 통화 수"
          value={formatNumber(summary?.totalCalls)}
          change={summary?.totalCallsChange}
        />
        <KPICard
          title="통화 성공률"
          value={formatPercent(summary?.successRate)}
          change={summary?.successRateChange}
        />
        <KPICard
          title="평균 통화 시간"
          value={`${formatNumber(callStatistics?.avgDuration)}초`}
        />
        <KPICard
          title="위험 대상자"
          value={`${formatNumber(summary?.riskPatients)}명`}
          change={summary?.riskPatientsChange}
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
    </div>
  );
}

export default ReportPage;
