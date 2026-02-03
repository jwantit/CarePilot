import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigation } from '../../hooks/useNavigation';
import { useAuth } from '../../hooks/useAuth';
import { getCallHistory } from '../../api/callApi';
import { getTaskList } from '../../api/task/taskApi';
import { getNotifications } from '../../api/notificationApi';
import { getCareTargetAllList } from '../../api/caretarget/careTargetApi';

function DashboardPage() {
  const navigate = useNavigate();
  const { navigateToCall, navigateToTask, navigateToNotification, navigateToCareTarget } = useNavigation();
  const { user } = useAuth();
  const currentUserId = user?.userId || null;
  const currentOrgId = user?.organizationId || null;

  // 통계 데이터 상태
  const [callStats, setCallStats] = useState({ 
    total: 0, 
    successRate: 0, 
    changeRate: 0, 
    isIncrease: true 
  });
  const [riskStats, setRiskStats] = useState({ total: 0, urgent: 0 });
  const [taskStats, setTaskStats] = useState({ total: 0, waiting: 0 });
  const [notificationStats, setNotificationStats] = useState({ total: 0, unprocessed: 0 });
  const [bannerStats, setBannerStats] = useState({ urgentAlerts: 0, riskPatients: 0, failedCalls: 0 });
  const [loading, setLoading] = useState(true);
  
  // Zone 3 데이터 상태
  const [urgentPatients, setUrgentPatients] = useState([]);
  const [waitingTasks, setWaitingTasks] = useState([]);
  const [urgentNotifications, setUrgentNotifications] = useState([]);
  const [actionItems, setActionItems] = useState([]); // 통합된 작업 목록

  // 데이터 로드
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentOrgId) {
        setLoading(false);
        return;
      }

      try {
        // 통화 통계 계산
        const callHistory = await getCallHistory(currentOrgId);
        const totalCalls = callHistory?.length || 0;
        const successCalls = callHistory?.filter(call => call.status === 'SUCCESS').length || 0;
        const successRate = totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 0;
        const failedCalls = callHistory?.filter(call => call.status === 'FAILED').length || 0;
        
        // 이전 기간과 비교하여 증가/감소율 계산
        // 최근 7일 vs 그 이전 7일
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        
        // 날짜 파싱 헬퍼 함수
        const parseDateTime = (dateString) => {
          if (!dateString) return null;
          // "yyyy-MM-dd HH:mm:ss" 형식을 Date로 변환
          const normalized = dateString.replace(' ', 'T');
          const parsed = new Date(normalized);
          return Number.isNaN(parsed.getTime()) ? null : parsed;
        };
        
        // 최근 7일간 통화
        const recentCalls = callHistory?.filter(call => {
          const callDate = parseDateTime(call.startTime);
          return callDate && callDate >= sevenDaysAgo;
        }) || [];
        
        // 그 이전 7일간 통화
        const previousCalls = callHistory?.filter(call => {
          const callDate = parseDateTime(call.startTime);
          return callDate && callDate >= fourteenDaysAgo && callDate < sevenDaysAgo;
        }) || [];
        
        // 각 기간의 성공률 계산
        const recentTotal = recentCalls.length;
        const recentSuccess = recentCalls.filter(call => call.status === 'SUCCESS').length;
        const recentSuccessRate = recentTotal > 0 ? (recentSuccess / recentTotal) * 100 : 0;
        
        const previousTotal = previousCalls.length;
        const previousSuccess = previousCalls.filter(call => call.status === 'SUCCESS').length;
        const previousSuccessRate = previousTotal > 0 ? (previousSuccess / previousTotal) * 100 : 0;
        
        // 증가/감소율 계산
        let changeRate = 0;
        let isIncrease = true;
        
        if (previousTotal > 0 && previousSuccessRate >= 0) {
          // 이전 기간에 데이터가 있는 경우
          changeRate = Math.round(Math.abs(recentSuccessRate - previousSuccessRate));
          isIncrease = recentSuccessRate >= previousSuccessRate;
        } else if (recentTotal > 0 && previousTotal === 0) {
          // 이전 기간에 데이터가 없고 현재 기간에만 있는 경우
          changeRate = 0;
          isIncrease = true;
        }
        // 둘 다 데이터가 없으면 changeRate = 0, isIncrease = true (기본값)
        
        setCallStats({ 
          total: totalCalls, 
          successRate, 
          changeRate, 
          isIncrease 
        });
        setBannerStats(prev => ({ ...prev, failedCalls }));

        // 위험 환자 통계 계산
        let urgentPatientsList = [];
        try {
          const careTargets = await getCareTargetAllList(currentOrgId, '');
          const riskPatients = (careTargets || []).filter(patient => {
            const riskLevel = patient?.riskLevel;
            return riskLevel === 'HIGH' || riskLevel === 'CRITICAL';
          });
          urgentPatientsList = (careTargets || []).filter(patient => 
            patient?.riskLevel === 'CRITICAL'
          );
          
          setRiskStats({ total: riskPatients.length, urgent: urgentPatientsList.length });
          setBannerStats(prev => ({ ...prev, riskPatients: riskPatients.length }));
          setUrgentPatients(urgentPatientsList);
        } catch (error) {
          console.error('위험 환자 통계 로드 실패:', error);
          setRiskStats({ total: 0, urgent: 0 });
          setUrgentPatients([]);
        }

        // 작업 통계 계산
        let waitingTasksList = [];
        try {
          const tasks = await getTaskList({});
          const taskArray = Array.isArray(tasks) ? tasks : [];
          const totalTasks = taskArray.length;
          waitingTasksList = taskArray.filter(task => 
            task?.status === 'WAITING'
          );
          const waitingCount = waitingTasksList.length;
          
          setTaskStats({ total: totalTasks, waiting: waitingCount });
          setWaitingTasks(waitingTasksList);
        } catch (error) {
          console.error('작업 통계 로드 실패:', error);
          setTaskStats({ total: 0, waiting: 0 });
          setWaitingTasks([]);
        }

        // 알림 통계 계산
        let urgentAlertsList = [];
        if (currentUserId) {
          try {
            const notifications = await getNotifications(currentUserId);
            const notificationArray = Array.isArray(notifications) ? notifications : [];
            const totalNotifications = notificationArray.length;
            const unprocessedNotifications = notificationArray.filter(notif => 
              notif?.status === 'ACTIVE'
            ).length;
            urgentAlertsList = notificationArray.filter(notif => {
              const severity = notif?.severity;
              return (severity === 'CRITICAL' || severity === 'HIGH') && notif?.status === 'ACTIVE';
            });
            const urgentAlerts = urgentAlertsList.length;
            
            setNotificationStats({ total: totalNotifications, unprocessed: unprocessedNotifications });
            setBannerStats(prev => ({ ...prev, urgentAlerts }));
            setUrgentNotifications(urgentAlertsList);
          } catch (error) {
            console.error('알림 통계 로드 실패:', error);
            setNotificationStats({ total: 0, unprocessed: 0 });
            setUrgentNotifications([]);
          }
        }

        // Zone 3용 통합 작업 목록 생성 (최대 7개)
        const allActionItems = [];
        
        // 긴급 환자 추가
        urgentPatientsList.forEach(patient => {
          allActionItems.push({
            type: 'patient',
            id: patient.careTargetId,
            label: '긴급 환자:',
            content: `${patient.name || '이름 없음'} (${patient.age}세)`,
            actions: [
              { text: '[상세보기]', onClick: () => navigate(`/care-target/detail/${patient.careTargetId}`) },
              { text: '[통화하기]', onClick: navigateToCall }
            ]
          });
        });

        // 대기 중인 작업 추가
        waitingTasksList.forEach(task => {
          allActionItems.push({
            type: 'task',
            id: task.taskId,
            label: '대기 중인 작업:',
            content: task.title || '작업 제목 없음',
            actions: [
              { text: '[처리하기]', onClick: navigateToTask }
            ]
          });
        });

        // 긴급 알림 추가
        urgentAlertsList.forEach(notif => {
          allActionItems.push({
            type: 'notification',
            id: notif.notificationId,
            label: '긴급 알림:',
            content: notif.title || notif.description || '알림 내용 없음',
            actions: [
              { text: '[수동 통화]', onClick: navigateToCall }
            ]
          });
        });

        // 최대 7개까지만 표시
        setActionItems(allActionItems.slice(0, 7));
      } catch (error) {
        console.error('대시보드 데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentOrgId, currentUserId, navigate, navigateToCall, navigateToTask]);

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50">
      {/* 1번 박스: 긴급 알림 배너 */}
      <div className="bg-red-500 text-white rounded-xl p-6 mb-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-lg font-bold">긴급 알림 {bannerStats.urgentAlerts}건</span>
            </div>
            <div>
              <span className="text-lg font-bold">케어 대상 {bannerStats.riskPatients}명</span>
            </div>
            <div>
              <span className="text-lg font-bold">통화 실패 {bannerStats.failedCalls}건</span>
            </div>
          </div>
          <button className="bg-white text-red-500 px-6 py-2 rounded-lg font-bold hover:bg-red-50 transition">
            바로 확인하기 →
          </button>
        </div>
      </div>

      {/* 2번 박스: 주요 지표 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* 통화 카드 */}
        <div 
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
          onClick={navigateToCall}
        >
          <div className="flex items-start gap-2">
            <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f0f9f9' }}>
              <svg className="w-8 h-8" style={{ color: '#008080' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-bold text-gray-800 mb-2 leading-tight">
                {loading ? '로딩 중...' : `통화 ${callStats.total}건`}
              </div>
              <div className="space-y-0.5">
                <div className={`text-sm leading-tight ${
                  loading 
                    ? 'text-green-600' 
                    : callStats.changeRate === 0 
                      ? 'text-gray-600' 
                      : callStats.isIncrease 
                        ? 'text-green-600' 
                        : 'text-red-600'
                }`}>
                  {loading ? '...' : `성공률 ${callStats.successRate}%`}
                </div>
                {!loading && callStats.changeRate > 0 && (
                  <div className={`text-sm font-semibold leading-tight ${
                    callStats.isIncrease 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {callStats.isIncrease ? '↑' : '↓'}{callStats.changeRate}%
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 위험 카드 */}
        <div 
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
          onClick={navigateToCareTarget}
        >
          <div className="flex items-start gap-2">
            <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#fef2f2' }}>
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-bold text-gray-800 mb-2 leading-tight">
                {loading ? '로딩 중...' : `위험 ${riskStats.total}명`}
              </div>
              <div className="text-sm text-red-600 font-semibold leading-tight">
                {loading ? '...' : `긴급 ${riskStats.urgent}명`}
              </div>
            </div>
          </div>
        </div>

        {/* 작업 카드 */}
        <div 
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
          onClick={navigateToTask}
        >
          <div className="flex items-start gap-2">
            <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f0f9f9' }}>
              <svg className="w-8 h-8" style={{ color: '#008080' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-bold text-gray-800 mb-2 leading-tight">
                {loading ? '로딩 중...' : `작업 ${taskStats.total}건`}
              </div>
              <div className="text-sm leading-tight whitespace-nowrap">
                <span className="text-yellow-600 font-semibold">
                  {loading ? '...' : `대기 ${taskStats.waiting}건`}
                </span>
                <span className="text-gray-500 ml-1">→ 확인</span>
              </div>
            </div>
          </div>
        </div>

        {/* 알림 카드 */}
        <div 
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
          onClick={navigateToNotification}
        >
          <div className="flex items-start gap-2">
            <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f0f9f9' }}>
              <svg className="w-8 h-8" style={{ color: '#008080' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-bold text-gray-800 mb-2 leading-tight">
                {loading ? '로딩 중...' : `알림 ${notificationStats.total}건`}
              </div>
              <div className="text-sm leading-tight whitespace-nowrap">
                <span className="text-orange-600 font-semibold">
                  {loading ? '...' : `미처리 ${notificationStats.unprocessed}건`}
                </span>
                <span className="text-gray-500 ml-1">→ 확인</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3, 4번 박스 공간 (좌우 2열 레이아웃) */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* 3번 박스: 즉시 조치 필요 (왼쪽) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[400px]">
          {/* 헤더 */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <h3 className="text-lg font-bold text-gray-800">즉시 조치 필요</h3>
          </div>

          {/* 통합 작업 목록 (최대 7개) */}
          {actionItems.length > 0 ? (
            <div className="space-y-2">
              {actionItems.map((item) => (
                <div 
                  key={`${item.type}-${item.id}`}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition"
                >
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">{item.label}</span>
                      <span className={`${item.type === 'patient' ? 'text-gray-800' : 'text-gray-600'} truncate`}>
                        {item.content}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {item.actions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={action.onClick}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium underline whitespace-nowrap"
                        >
                          {action.text}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-400 text-center py-8">
              즉시 조치가 필요한 항목이 없습니다.
            </div>
          )}
        </div>

        {/* 4번 박스: 오늘의 일정 (오른쪽) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[400px]">
          {/* 여기에 4번 박스 내용이 들어갈 예정 */}
        </div>
      </div>

      {/* 5, 6번 박스 공간 (좌우 2열 레이아웃) */}
      <div className="grid grid-cols-2 gap-6">
        {/* 5번 박스: 최근 활동 (왼쪽) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[300px]">
          {/* 여기에 5번 박스 내용이 들어갈 예정 */}
        </div>

        {/* 6번 박스: 빠른 인사이트 (오른쪽) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[300px]">
          {/* 여기에 6번 박스 내용이 들어갈 예정 */}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;