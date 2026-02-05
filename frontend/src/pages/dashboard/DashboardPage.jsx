import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigation } from "../../hooks/useNavigation";
import Breadcrumb from "../../components/common/Breadcrumb";
import {
  getDashboardStats,
  getTodaySchedules,
  getUrgentItems,
  getRecentItems,
} from "../../api/dashboard/dashboardApi";

function DashboardPage() {
  const { user } = useAuth();
  const {
    navigateToCall,
    navigateToCareTarget,
    navigateToTask,
    navigateToNotification,
    navigateToCareTargetDetail,
  } = useNavigation();

  const currentOrgId = user?.organizationId;
  const currentUserId = user?.userId;

  // 백엔드에서 처리된 통계 데이터를 그대로 저장
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [urgentItems, setUrgentItems] = useState([]);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [recentItems, setRecentItems] = useState([]);

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

        // 즉시 조치 필요 항목 통합 조회 (백엔드에서 정렬 및 제한 처리)
        const urgentItemsList = await getUrgentItems(
          currentOrgId,
          currentUserId,
        );
        console.log("즉시 조치 필요 항목:", urgentItemsList);
        setUrgentItems(urgentItemsList || []);

        // 오늘의 일정 가져오기 (백엔드에서 정렬 및 제한 처리)
        const todaySchedulesList = await getTodaySchedules(currentOrgId);
        console.log("오늘의 일정:", todaySchedulesList);
        setTodaySchedules(todaySchedulesList || []);

        // 최근 활동 통합 조회 (백엔드에서 정렬 및 제한 처리)
        const recentItemsList = await getRecentItems(
          currentOrgId,
          currentUserId,
        );
        console.log("최근 활동:", recentItemsList);
        setRecentItems(recentItemsList || []);
      } catch (error) {
        console.error("대시보드 데이터 로드 실패:", error);
        console.error("에러 상세:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentOrgId, currentUserId]);

  // 백엔드에서 처리된 데이터를 그대로 사용 (매핑 로직 없음)
  // UI 렌더링을 위한 안전한 기본값 설정 (데이터 처리 로직은 백엔드에서 수행)
  const callStats = dashboardStats?.callStats || {};
  const riskStats = dashboardStats?.riskStats || {};
  const taskStats = dashboardStats?.taskStats || {};
  const notificationStats = dashboardStats?.notificationStats || {};
  const bannerStats = dashboardStats?.bannerStats || {};

  // 로딩 중이거나 데이터가 없을 때 (hooks 이후에 early return)
  if (loading || !dashboardStats) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin border-4 border-slate-700 border-t-teal-400 rounded-full w-12 h-12" />
          <p className="text-slate-400 text-sm font-mono">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={["대시보드"]} />
      {/* 1번 박스: 긴급 알림 배너 */}
      {((bannerStats.failedCalls || 0) > 0 ||
        (bannerStats.riskPatients || 0) > 0 ||
        (bannerStats.urgentAlerts || 0) > 0) && (
        <div className="bg-gradient-to-br from-red-900/80 to-red-950 border border-red-500/50 text-red-100 rounded-sm p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {(bannerStats.urgentAlerts || 0) > 0 && (
                <div>
                  <span className="text-lg font-bold">
                    긴급 알림 {bannerStats.urgentAlerts || 0}건
                  </span>
                </div>
              )}
              {(bannerStats.riskPatients || 0) > 0 && (
                <div>
                  <span className="text-lg font-bold">
                    위험 환자 {bannerStats.riskPatients || 0}명
                  </span>
                </div>
              )}
              {(bannerStats.failedCalls || 0) > 0 && (
                <div>
                  <span className="text-lg font-bold">
                    통화 실패 {bannerStats.failedCalls || 0}건
                  </span>
                </div>
              )}
            </div>
            <button className="bg-slate-800 text-red-300 border border-red-500/50 px-6 py-2 rounded-sm font-bold hover:bg-red-900/50 hover:border-red-500 transition">
              바로 확인하기 →
            </button>
          </div>
        </div>
      )}

      {/* 2번 박스: 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 통화 카드 */}
        <div
          className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 shadow-lg hover:shadow-xl hover:border-teal-500/50 transition-all cursor-pointer rounded-sm"
          onClick={navigateToCall}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-sm flex items-center justify-center flex-shrink-0 bg-slate-700/50 border border-slate-600">
              <svg
                className="w-7 h-7 text-teal-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              {/* 오늘 총 건수만 출력 */}
              <div className="text-2xl font-bold text-gray-800 mb-2">
                {loading ? "로딩 중..." : `통화 ${callStats.todayTotal || 0}건`}
              </div>

              <div className="text-sm text-green-600 mb-1">오늘 성공률</div>

              {/* 오늘 성공률 수치만 출력 */}
              <div className="text-sm font-semibold text-green-600">
                {loading ? "..." : `${callStats.todaySuccessRate || 0}%`}
              </div>

              {/* 참고: 어제 데이터는 callStats.yesterdayTotal 등에 들어있지만 화면엔 그리지 않음 */}
            </div>
          </div>
        </div>

        {/* 위험 카드 */}
        <div
          className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 shadow-lg hover:shadow-xl hover:border-red-500/50 transition-all cursor-pointer rounded-sm"
          onClick={navigateToCareTarget}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-sm flex items-center justify-center flex-shrink-0 bg-red-500/10 border border-red-500/30">
              <svg
                className="w-7 h-7 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.332.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-bold text-slate-100 mb-2">
                {loading ? "로딩 중..." : `위험 ${riskStats.total || 0}명`}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">
                <span className="text-red-400 font-semibold">
                  {loading ? "로딩 중..." : `긴급 ${riskStats.urgent || 0}명`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 작업 카드 */}
        <div
          className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 shadow-lg hover:shadow-xl hover:border-teal-500/50 transition-all cursor-pointer rounded-sm"
          onClick={navigateToTask}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-sm flex items-center justify-center flex-shrink-0 bg-slate-700/50 border border-slate-600">
              <svg
                className="w-7 h-7 text-teal-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-bold text-slate-100 mb-2">
                {loading ? "로딩 중..." : `작업 ${taskStats.total || 0}건`}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">
                <span className="text-yellow-400 font-semibold">
                  {loading ? "로딩 중..." : `대기 ${taskStats.waiting || 0}건`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 알림 카드 */}
        <div
          className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 shadow-lg hover:shadow-xl hover:border-teal-500/50 transition-all cursor-pointer rounded-sm"
          onClick={navigateToNotification}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-sm flex items-center justify-center flex-shrink-0 bg-slate-700/50 border border-slate-600">
              <svg
                className="w-7 h-7 text-teal-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-bold text-slate-100 mb-2">
                {loading
                  ? "로딩 중..."
                  : `알림 ${notificationStats.total || 0}건`}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">
                <span className="text-yellow-400 font-semibold">
                  {loading
                    ? "로딩 중..."
                    : `미처리 ${notificationStats.unprocessed || 0}건`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 섹션 - 3번~6번 박스 (2x2 그리드, 모두 같은 크기) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 3번 박스: 즉시 조치 필요 (왼쪽 상단) */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-sm p-6 shadow-lg hover:shadow-xl transition-shadow min-h-[400px]">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <h3 className="text-lg font-bold text-slate-200">즉시 조치 필요</h3>
          </div>

          <div className="space-y-3 min-h-[340px]">
            {/* 긴급 항목 목록 (최대 5개, 각 종류 최소 1개씩) */}
            {urgentItems.map((item, index) => {
              // 시간 포맷팅 함수 (MM.dd HH:mm 형식)
              const formatDateTime = (dateTime) => {
                if (!dateTime) return "";
                try {
                  const date = new Date(dateTime);
                  const month = String(date.getMonth() + 1).padStart(2, "0");
                  const day = String(date.getDate()).padStart(2, "0");
                  const hours = String(date.getHours()).padStart(2, "0");
                  const minutes = String(date.getMinutes()).padStart(2, "0");
                  return `${month}.${day} ${hours}:${minutes}`;
                } catch (e) {
                  return "";
                }
              };

              if (item.type === "patient") {
                const patient = item.data;
                const timeStr = formatDateTime(patient.riskCalculatedAt);
                return (
                  <div
                    key={`patient-${patient.careTargetId}`}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-gray-800 truncate">
                        긴급 환자: {patient.name} ({patient.age}세)
                      </span>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {timeStr && (
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {timeStr}
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              navigateToCareTargetDetail(patient.careTargetId)
                            }
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
                  </div>
                );
              } else if (item.type === "task") {
                const task = item.data;
                const timeStr = formatDateTime(task.createdAt);
                return (
                  <div
                    key={`task-${task.taskId}`}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-gray-800 truncate">
                        대기 중인 작업: {task.title || "작업 제목 없음"}
                      </span>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {timeStr && (
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {timeStr}
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={navigateToTask}
                            className="text-sm text-gray-800 hover:text-blue-600 underline"
                          >
                            [처리하기]
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else if (item.type === "notification") {
                const notification = item.data;
                const timeStr = formatDateTime(notification.occurredAt);
                return (
                  <div
                    key={`notification-${notification.notificationId}`}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-gray-800 truncate">
                        긴급 알림:{" "}
                        {notification.title ||
                          notification.description ||
                          "알림 내용 없음"}
                      </span>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {timeStr && (
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {timeStr}
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={navigateToNotification}
                            className="text-sm text-gray-800 hover:text-blue-600 underline"
                          >
                            [알림확인]
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>

          {urgentItems.length === 0 && !loading && (
            <div className="text-sm text-gray-500 text-center py-8">
              즉시 조치가 필요한 항목이 없습니다.
            </div>
          )}
        </div>

        {/* 4번 박스: 오늘의 일정 (우측 상단) */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-sm p-6 shadow-lg hover:shadow-xl transition-shadow min-h-[400px] flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <svg
              className="w-5 h-5 text-teal-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-lg font-bold text-slate-200">오늘의 일정</h3>
          </div>

          <div className="space-y-3 flex-1 min-h-[340px]">
            {/* 정기 통화 일정 (최대 5개) */}
            {todaySchedules.map((schedule) => {
              const formatTime = (timeStr) => {
                if (!timeStr) return "";
                try {
                  const [datePart, timePart] = timeStr.split(" ");
                  const [hours, minutes] = timePart.split(":");
                  const hour = parseInt(hours);
                  const ampm = hour >= 12 ? "오후" : "오전";
                  const displayHour =
                    hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                  return `${ampm} ${displayHour}:${minutes}`;
                } catch (e) {
                  return timeStr;
                }
              };

              const getScheduleStatus = () => {
                if (!schedule.scheduledTime) return "[예정]";
                const now = new Date();
                const scheduledDate = new Date(schedule.scheduledTime);
                if (schedule.status === "COMPLETED") return "[완료됨✓]";
                if (now >= scheduledDate && schedule.status !== "COMPLETED")
                  return "[진행 중..]";
                return "[예정]";
              };

              const timeStr = formatTime(
                schedule.scheduledTime || schedule.nextRunAt,
              );
              const statusStr = getScheduleStatus();
              const isCompleted = schedule.status === "COMPLETED";
              const isInProgress = statusStr === "[진행 중..]";

              return (
                <div
                  key={schedule.scheduleId}
                  className="bg-slate-700/30 rounded-sm p-4 border border-slate-600"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-800 truncate">
                      정기 통화 {timeStr}{" "}
                      {schedule.careTargetName ||
                        schedule.targetGroupName ||
                        "대상자 없음"}
                    </span>
                    <span
                      className={`text-sm flex-shrink-0 ${isCompleted ? "text-teal-600" : isInProgress ? "text-gray-600" : "text-gray-800"}`}
                    >
                      {statusStr}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {todaySchedules.length === 0 && !loading && (
            <div className="text-sm text-slate-500 text-center py-8 flex-1 flex items-center justify-center">
              오늘 예정된 일정이 없습니다.
            </div>
          )}

          <div className="mt-auto pt-4 text-right">
            <button
              onClick={navigateToCall}
              className="text-sm text-slate-400 hover:text-teal-400 underline"
            >
              [전체 일정 보기 →]
            </button>
          </div>
        </div>

        {/* 5번 박스: 최근 활동 (왼쪽 하단) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-h-[400px]">
          <div className="flex items-center gap-2 mb-6">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="text-lg font-bold text-gray-800">최근 활동</h3>
          </div>

          <div className="space-y-3 min-h-[340px]">
            {/* 최근 활동 목록 (최대 5개, 각 종류 최소 1개씩) */}
            {recentItems.map((item) => {
              if (item.type === "notification") {
                const notification = item.data;
                return (
                  <div
                    key={`notification-${notification.notificationId}`}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-gray-800 truncate">
                        [최근 알림]:{" "}
                        {notification.title ||
                          notification.description ||
                          "알림 내용 없음"}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={navigateToNotification}
                          className="text-sm text-gray-800 hover:text-blue-600 underline whitespace-nowrap"
                        >
                          [처리하기]
                        </button>
                      </div>
                    </div>
                  </div>
                );
              } else if (item.type === "task") {
                const task = item.data;
                return (
                  <div
                    key={`task-${task.taskId}`}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-gray-800 truncate">
                        [최근 작업]: {task.title || "작업 제목 없음"}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={navigateToTask}
                          className="text-sm text-gray-800 hover:text-blue-600 underline whitespace-nowrap"
                        >
                          [처리하기]
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>

          {recentItems.length === 0 && !loading && (
            <div className="text-sm text-gray-500 text-center py-8">
              최근 활동이 없습니다.
            </div>
          )}
        </div>

        {/* 6번 박스: 오른쪽 하단 */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-sm p-6 shadow-lg hover:shadow-xl transition-shadow min-h-[400px]">
          {/* 여기에 내용이 들어갈 예정 */}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
