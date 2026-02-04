import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigation } from "../../hooks/useNavigation";
import { getDashboardStats, getUrgentPatients, getWaitingTasks, getUrgentNotifications, getTodaySchedules, getInProgressTasks } from "../../api/dashboard/dashboardApi";

function DashboardPage() {
  const { user } = useAuth();
  const { navigateToCall, navigateToCareTarget, navigateToTask, navigateToNotification, navigateToCareTargetDetail } = useNavigation();
  
  const currentOrgId = user?.organizationId;
  const currentUserId = user?.userId;

  // 백엔드에서 처리된 통계 데이터를 그대로 저장
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [urgentPatients, setUrgentPatients] = useState([]);
  const [waitingTasks, setWaitingTasks] = useState([]);
  const [urgentNotifications, setUrgentNotifications] = useState([]);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [inProgressTasks, setInProgressTasks] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentOrgId) {
        setLoading(false);
        return;
      }

      try {
        // 백엔드에서 처리된 통계 데이터 가져오기 (매핑 로직 없이 그대로 사용)
        const stats = await getDashboardStats(currentOrgId, currentUserId);
        setDashboardStats(stats);
        
        // 긴급 환자 목록 가져오기 (백엔드에서 정렬된 데이터를 그대로 사용)
        const urgentPatientsList = await getUrgentPatients(currentOrgId);
        setUrgentPatients(urgentPatientsList || []);
        
        // 대기 중인 작업 목록 가져오기
        const waitingTasksList = await getWaitingTasks(currentOrgId);
        setWaitingTasks(waitingTasksList || []);
        
        // 긴급 알림 목록 가져오기
        const urgentNotificationsList = await getUrgentNotifications(currentOrgId, currentUserId);
        setUrgentNotifications(urgentNotificationsList || []);
        
        // 오늘의 일정 가져오기 (백엔드에서 정렬된 데이터를 그대로 사용)
        const todaySchedulesList = await getTodaySchedules(currentOrgId);
        setTodaySchedules(todaySchedulesList || []);
        
        // 진행 중인 작업 가져오기 (백엔드에서 정렬된 데이터를 그대로 사용)
        const inProgressTasksList = await getInProgressTasks(currentOrgId);
        setInProgressTasks(inProgressTasksList || []);
      } catch (error) {
        console.error("대시보드 데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentOrgId, currentUserId]);

  // 로딩 중이거나 데이터가 없을 때
  if (loading || !dashboardStats) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-gray-500">데이터를 불러오는 중...</div>
      </div>
    );
  }

  // 백엔드에서 처리된 데이터를 그대로 사용 (매핑 로직 없음)
  // UI 렌더링을 위한 안전한 기본값 설정 (데이터 처리 로직은 백엔드에서 수행)
  const callStats = dashboardStats.callStats || {};
  const riskStats = dashboardStats.riskStats || {};
  const taskStats = dashboardStats.taskStats || {};
  const notificationStats = dashboardStats.notificationStats || {};
  const bannerStats = dashboardStats.bannerStats || {};

  return (
    <div className="p-6 space-y-6">
      {/* 1번 박스: 긴급 알림 배너 */}
      {((bannerStats.failedCalls || 0) > 0 || (bannerStats.riskPatients || 0) > 0 || (bannerStats.urgentAlerts || 0) > 0) && (
        <div className="bg-red-500 text-white rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {(bannerStats.urgentAlerts || 0) > 0 && (
                <div>
                  <span className="text-lg font-bold">긴급 알림 {bannerStats.urgentAlerts || 0}건</span>
                </div>
              )}
              {(bannerStats.riskPatients || 0) > 0 && (
                <div>
                  <span className="text-lg font-bold">위험 환자 {bannerStats.riskPatients || 0}명</span>
                </div>
              )}
              {(bannerStats.failedCalls || 0) > 0 && (
                <div>
                  <span className="text-lg font-bold">통화 실패 {bannerStats.failedCalls || 0}건</span>
                </div>
              )}
            </div>
            <button className="bg-white text-red-500 px-6 py-2 rounded-lg font-bold hover:bg-red-50 transition">
              바로 확인하기 →
            </button>
          </div>
        </div>
      )}

      {/* 2번 박스: 주요 지표 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* 통화 카드 */}
        <div
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
          onClick={navigateToCall}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f0f9f9' }}>
              <svg className="w-8 h-8" style={{ color: '#008080' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-bold text-gray-800 mb-2">
                {loading ? '로딩 중...' : `통화 ${callStats.total || 0}건`}
              </div>
              <div className="text-sm text-green-600 mb-1">성공률</div>
              <div
                className={`text-sm font-semibold ${
                  (callStats.changeRate || 0) === 0 ? "text-gray-500" : "text-green-600"
                }`}
              >
                {loading
                  ? "..."
                  : `${callStats.successRate || 0}%${
                      (callStats.changeRate || 0) > 0
                        ? ` ↑+${callStats.changeRate || 0}%`
                        : (callStats.changeRate || 0) < 0
                          ? ` ↓${Math.abs(callStats.changeRate || 0)}%`
                          : ""
                    }`}
              </div>
            </div>
          </div>
        </div>

        {/* 위험 카드 */}
        <div
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
          onClick={navigateToCareTarget}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#fef2f2' }}>
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.332.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-bold text-gray-800 mb-2">
                {loading ? "로딩 중..." : `위험 ${riskStats.total || 0}명`}
              </div>
              <div className="text-sm text-gray-600">
                <span className="text-red-600 font-semibold">
                  {loading ? "..." : `긴급 ${riskStats.urgent || 0}명`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 작업 카드 */}
        <div
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
          onClick={navigateToTask}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f0f9f9' }}>
              <svg className="w-8 h-8" style={{ color: '#008080' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-bold text-gray-800 mb-2">
                {loading ? "로딩 중..." : `작업 ${taskStats.total || 0}건`}
              </div>
              <div className="text-sm text-gray-600">
                <span className="text-yellow-600 font-semibold">
                  {loading ? "..." : `대기 ${taskStats.waiting || 0}건`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 알림 카드 */}
        <div
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
          onClick={navigateToNotification}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f0f9f9' }}>
              <svg className="w-8 h-8" style={{ color: '#008080' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-bold text-gray-800 mb-2">
                {loading ? "로딩 중..." : `알림 ${notificationStats.total || 0}건`}
              </div>
              <div className="text-sm text-gray-600">
                <span className="text-yellow-600 font-semibold">
                  {loading ? "..." : `미처리 ${notificationStats.unprocessed || 0}건`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 섹션 - 3번~6번 박스 (2x2 그리드, 모두 같은 크기) */}
      <div className="grid grid-cols-2 gap-4">
        {/* 3번 박스: 즉시 조치 필요 (왼쪽 상단) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[400px]">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <h3 className="text-lg font-bold text-gray-800">즉시 조치 필요</h3>
          </div>
          
          <div className="space-y-3">
            {/* 긴급 환자 목록 */}
            {urgentPatients.map((patient) => (
              <div key={patient.careTargetId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-800 truncate">
                    긴급 환자: {patient.name} ({patient.age}세)
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => navigateToCareTargetDetail(patient.careTargetId)}
                      className="text-sm text-gray-800 hover:text-blue-600 underline"
                    >
                      [상세보기]
                    </button>
                    <button
                      onClick={navigateToCareTarget}
                      className="text-sm text-gray-800 hover:text-blue-600 underline"
                    >
                      [통화하기]
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* 대기 중인 작업 목록 (우선순위 긴급만) */}
            {waitingTasks
              .filter(task => task.priority === 'URGENT')
              .map((task) => (
                <div key={task.taskId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-800 truncate">
                      대기 중인 작업: {task.title || '작업 제목 없음'}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={navigateToTask}
                        className="text-sm text-gray-800 hover:text-blue-600 underline"
                      >
                        [처리하기]
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            
            {/* 긴급 알림 목록 */}
            {urgentNotifications.map((notification) => (
              <div key={notification.notificationId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-800 truncate">
                    긴급 알림: {notification.title || notification.description || '알림 내용 없음'}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={navigateToNotification}
                      className="text-sm text-gray-800 hover:text-blue-600 underline"
                    >
                      [알림확인]
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {urgentPatients.length === 0 && waitingTasks.filter(task => task.priority === 'URGENT').length === 0 && urgentNotifications.length === 0 && !loading && (
            <div className="text-sm text-gray-500 text-center py-8">
              즉시 조치가 필요한 항목이 없습니다.
            </div>
          )}
        </div>

        {/* 4번 박스: 오늘의 일정 (우측 상단) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[400px] flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-bold text-gray-800">오늘의 일정</h3>
          </div>
          
          <div className="space-y-3 flex-1">
            {/* 정기 통화 일정 */}
            {todaySchedules.map((schedule) => {
              // 시간 포맷팅 (오전/오후 형식)
              const formatTime = (timeStr) => {
                if (!timeStr) return '';
                try {
                  const [datePart, timePart] = timeStr.split(' ');
                  const [hours, minutes] = timePart.split(':');
                  const hour = parseInt(hours);
                  const ampm = hour >= 12 ? '오후' : '오전';
                  const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                  return `${ampm} ${displayHour}:${minutes}`;
                } catch (e) {
                  return timeStr;
                }
              };
              
              // 상태 결정 로직
              const getScheduleStatus = () => {
                if (!schedule.scheduledTime) return '[예정]';
                
                const now = new Date();
                const scheduledDate = new Date(schedule.scheduledTime);
                
                // 완료된 경우
                if (schedule.status === 'COMPLETED') {
                  return '[완료됨✓]';
                }
                
                // 시작 시간을 넘긴 경우 (진행 중)
                if (now >= scheduledDate && schedule.status !== 'COMPLETED') {
                  return '[진행 중..]';
                }
                
                // 아직 시작되지 않은 경우
                return '[예정]';
              };
              
              const timeStr = formatTime(schedule.scheduledTime || schedule.nextRunAt);
              const statusStr = getScheduleStatus();
              const isCompleted = schedule.status === 'COMPLETED';
              const isInProgress = statusStr === '[진행 중..]';
              
              return (
                <div key={schedule.scheduleId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between gap-4">
                    <span className={`text-sm ${isCompleted ? 'text-teal-600' : isInProgress ? 'text-gray-600' : 'text-gray-800'} truncate`}>
                      정기 통화 {timeStr} {schedule.careTargetName || schedule.targetGroupName || '대상자 없음'} {statusStr}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {/* 작업 진행 - 주석 처리 (나중에 다른 곳으로 옮길 예정) */}
            {/* {inProgressTasks.map((task) => (
              <div key={task.taskId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-800 truncate">
                    작업 진행: {task.title || '작업 제목 없음'}
                  </span>
                </div>
              </div>
            ))} */}
          </div>
          
          {todaySchedules.length === 0 && !loading && (
            <div className="text-sm text-gray-500 text-center py-8 flex-1 flex items-center justify-center">
              오늘 예정된 일정이 없습니다.
            </div>
          )}
          
          {/* 전체 일정 보기 버튼 - 우측 하단 고정 */}
          <div className="mt-auto pt-4 text-right">
            <button
              onClick={navigateToCall}
              className="text-sm text-gray-600 hover:text-blue-600 underline"
            >
              [전체 일정 보기 →
            </button>
          </div>
        </div>

        {/* 5번 박스: 왼쪽 하단 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[400px]">
          {/* 여기에 내용이 들어갈 예정 */}
        </div>

        {/* 6번 박스: 오른쪽 하단 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[400px]">
          {/* 여기에 내용이 들어갈 예정 */}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
