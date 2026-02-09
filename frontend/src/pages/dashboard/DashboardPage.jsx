import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigation } from "../../hooks/useNavigation";
import Breadcrumb from "../../components/common/Breadcrumb";
import {
  getDashboardStats,
  getTodaySchedules,
  getUrgentItems,
  getRecentItems,
} from "../../api/dashboard/dashboardApi";
import { getCareGroupList } from "../../api/caretarget/careTargetGroupApi";

function DashboardPage() {
  const { user } = useAuth();
  const {
    navigateToCall,
    navigateToCareTarget,
    navigateToTask,
    navigateToNotification,
    navigateToCareTargetDetail,
    navigateToCareTargetGroup,
  } = useNavigation();

  const currentOrgId = user?.organizationId;
  const currentUserId = user?.userId;

  // 백엔드에서 처리된 통계 데이터를 그대로 저장
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [urgentItems, setUrgentItems] = useState([]);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [careGroups, setCareGroups] = useState([]);

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

        // 그룹 현황 조회
        const groupsList = await getCareGroupList(currentOrgId);
        console.log("그룹 현황:", groupsList);
        setCareGroups(groupsList || []);
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

  // 시간 포맷팅 헬퍼 함수들
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

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    try {
      const [datePart, timePart] = timeStr.split(" ");
      const [hours, minutes] = timePart.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "오후" : "오전";
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${ampm} ${displayHour}:${minutes}`;
    } catch (e) {
      return timeStr;
    }
  };

  // 로딩 중이거나 데이터가 없을 때 (hooks 이후에 early return)
  if (loading || !dashboardStats) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin border-4 border-slate-200 border-t-teal-500 rounded-full w-12 h-12 dark:border-slate-700 dark:border-t-teal-400" />
          <p className="text-slate-500 text-sm font-mono dark:text-slate-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={["대시보드"]} />
      {/* 2번 박스: 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 통화 카드 */}
        <div
          className="bg-white border border-slate-200 p-6 shadow-lg hover:shadow-xl hover:border-teal-500/50 transition-all cursor-pointer rounded-sm flex items-center dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 dark:border-slate-700"
          onClick={() => {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
            navigateToCall(todayStr);
          }}
        >
          <div className="flex items-center gap-4 w-full">
            <div className="w-14 h-14 rounded-sm flex items-center justify-center flex-shrink-0 bg-slate-100 border border-slate-200 dark:bg-slate-700/50 dark:border-slate-600">
              <svg
                className="w-7 h-7 text-teal-600 dark:text-teal-400"
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
            <div className="flex-1 min-w-0 ml-8">
              {/* 오늘 총 건수만 출력 */}
              <div className="text-2xl font-bold text-slate-900 mb-2 dark:text-white">
                통화 {callStats.todayTotal || 0}건
              </div>

              <div className="text-sm text-slate-600 mb-1 dark:text-slate-400">오늘 성공률</div>

              {/* 오늘 성공률 수치만 출력 */}
              <div className="text-sm font-semibold text-green-600">
                {callStats.todaySuccessRate || 0}%
              </div>
            </div>
          </div>
        </div>

        {/* 위험 카드 */}
        <div
          className="bg-white border border-slate-200 p-6 shadow-lg hover:shadow-xl hover:border-red-500/50 transition-all cursor-pointer rounded-sm flex items-center dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 dark:border-slate-700"
          onClick={navigateToCareTarget}
        >
          <div className="flex items-center gap-4 w-full">
            <div className="w-14 h-14 rounded-sm flex items-center justify-center flex-shrink-0 bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/30">
              <svg
                className="w-7 h-7 text-red-600 dark:text-red-400"
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
            <div className="flex-1 min-w-0 ml-8">
              <div className="text-2xl font-bold text-slate-900 mb-2 dark:text-white">
                위험 {riskStats.total || 0}명
              </div>
              <div className="text-xs text-slate-600 uppercase tracking-wider dark:text-slate-400">
                <span className="text-red-500 font-semibold dark:text-red-400">
                  긴급 {riskStats.urgent || 0}명
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 작업 카드 */}
        <div
          className="bg-white border border-slate-200 p-6 shadow-lg hover:shadow-xl hover:border-teal-500/50 transition-all cursor-pointer rounded-sm flex items-center dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 dark:border-slate-700"
          onClick={() => navigateToTask('WAITING,IN_PROGRESS')}
        >
          <div className="flex items-center gap-4 w-full">
            <div className="w-14 h-14 rounded-sm flex items-center justify-center flex-shrink-0 bg-slate-100 border border-slate-200 dark:bg-slate-700/50 dark:border-slate-600">
              <svg
                className="w-7 h-7 text-teal-600 dark:text-teal-400"
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
            <div className="flex-1 min-w-0 ml-8">
              <div className="text-2xl font-bold text-slate-900 mb-2 dark:text-white">
                작업 {taskStats.total || 0}건
              </div>
              <div className="text-xs text-slate-600 uppercase tracking-wider dark:text-slate-400">
                <span className="text-amber-600 font-semibold dark:text-yellow-400">
                  대기 {taskStats.waiting || 0}건
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 알림 카드 */}
        <div
          className="bg-white border border-slate-200 p-6 shadow-lg hover:shadow-xl hover:border-teal-500/50 transition-all cursor-pointer rounded-sm flex items-center dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 dark:border-slate-700"
          onClick={navigateToNotification}
        >
          <div className="flex items-center gap-4 w-full">
            <div className="w-14 h-14 rounded-sm flex items-center justify-center flex-shrink-0 bg-slate-100 border border-slate-200 dark:bg-slate-700/50 dark:border-slate-600">
              <svg
                className="w-7 h-7 text-teal-600 dark:text-teal-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0 ml-8">
              <div className="text-2xl font-bold text-slate-900 mb-2 dark:text-white">
                알림 {notificationStats.total || 0}건
              </div>
              <div className="text-xs text-slate-600 uppercase tracking-wider dark:text-slate-400">
                <span className="text-amber-600 font-semibold dark:text-yellow-400">
                  미처리 {notificationStats.unprocessed || 0}건
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 섹션 - 3번~6번 박스 (2x2 그리드, 모두 같은 크기) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 3번 박스: 즉시 조치 필요 (왼쪽 상단) */}
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-lg hover:shadow-xl transition-shadow min-h-[400px] flex flex-col dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">즉시 조치 필요</h3>
          </div>

          <div className="space-y-3 flex-1 min-h-[340px]">
            {/* 긴급 항목 목록 (최대 5개, 각 종류 최소 1개씩) */}
            {urgentItems.map((item) => {
              if (item.type === "patient") {
                const patient = item.data;
                // 백엔드에서 포맷된 시간 사용
                const timeStr = item.formattedTime || "";
                return (
                  <div
                    key={`patient-${patient.careTargetId}`}
                    className="bg-slate-50 rounded-sm p-4 border border-slate-200 dark:bg-slate-700/30 dark:border-slate-600"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-slate-900 truncate dark:text-white">
                        긴급 환자: {patient.name} ({patient.age}세)
                      </span>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {timeStr && (
                          <span className="text-xs text-slate-600 whitespace-nowrap dark:text-slate-400">
                            {timeStr}
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              navigateToCareTargetDetail(patient.careTargetId)
                            }
                            className="text-sm text-teal-600 hover:text-teal-700 dark:text-white dark:hover:text-teal-300"
                          >
                            [상세보기]
                          </button>
                          <button
                            onClick={navigateToCareTarget}
                            className="text-sm text-teal-600 hover:text-teal-700 dark:text-white dark:hover:text-teal-300"
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
                // 백엔드에서 포맷된 시간 사용
                const timeStr = item.formattedTime || "";
                return (
                  <div
                    key={`task-${task.taskId}`}
                    className="bg-slate-50 rounded-sm p-4 border border-slate-200 dark:bg-slate-700/30 dark:border-slate-600"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-slate-900 truncate dark:text-white">
                        대기 중인 작업: {task.title || "작업 제목 없음"}
                      </span>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {timeStr && (
                          <span className="text-xs text-slate-600 whitespace-nowrap dark:text-slate-400">
                            {timeStr}
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={navigateToTask}
                            className="text-sm text-teal-600 hover:text-teal-700 dark:text-white dark:hover:text-teal-300"
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
                // 백엔드에서 포맷된 시간 사용
                const timeStr = item.formattedTime || "";
                return (
                  <div
                    key={`notification-${notification.notificationId}`}
                    className="bg-slate-50 rounded-sm p-4 border border-slate-200 dark:bg-slate-700/30 dark:border-slate-600"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-slate-900 truncate dark:text-white">
                        긴급 알림:{" "}
                        {notification.title ||
                          notification.description ||
                          "알림 내용 없음"}
                      </span>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {timeStr && (
                          <span className="text-xs text-slate-600 whitespace-nowrap dark:text-slate-400">
                            {timeStr}
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={navigateToNotification}
                            className="text-sm text-teal-600 hover:text-teal-700 dark:text-white dark:hover:text-teal-300"
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
            <div className="text-sm text-slate-500 text-center py-8 flex-1 flex items-center justify-center dark:text-slate-300">
              즉시 조치가 필요한 항목이 없습니다.
            </div>
          )}
        </div>

        {/* 4번 박스: 오늘의 일정 (우측 상단) */}
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-lg hover:shadow-xl transition-shadow min-h-[400px] flex flex-col dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-teal-600 dark:text-teal-400"
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
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">오늘의 일정</h3>
            </div>
            <button
              onClick={navigateToCall}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 border border-teal-600 rounded text-teal-600 hover:border-teal-600 hover:bg-slate-200 transition-colors dark:bg-slate-900 dark:border-teal-400/50 dark:text-teal-400 dark:hover:border-teal-400 dark:hover:bg-slate-800"
            >
              <span className="text-teal-600 font-medium dark:text-teal-400">전체 일정 보기</span>
            </button>
          </div>

          <div className="space-y-3 flex-1 min-h-[340px]">
            {/* 정기 통화 일정 (최대 5개) */}
            {todaySchedules.map((schedule) => {
              // 백엔드에서 포맷된 시간과 상태 사용
              const timeStr = schedule.formattedTime || "";
              const statusStr = schedule.displayStatus || "[예정]";

              return (
                <div
                  key={schedule.scheduleId}
                  className="bg-slate-50 rounded-sm p-4 border border-slate-200 dark:bg-slate-700/30 dark:border-slate-600"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-900 truncate dark:text-white">
                      정기 통화 {timeStr}{" "}
                      {schedule.careTargetName ||
                        schedule.targetGroupName ||
                        "대상자 없음"}
                    </span>
                    <span
                      className={`text-sm flex-shrink-0 ${statusStr === "[완료됨✓]" ? "text-teal-600 dark:text-teal-300" : "text-slate-600 dark:text-slate-300"}`}
                    >
                      {statusStr}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {todaySchedules.length === 0 && !loading && (
            <div className="text-sm text-slate-500 text-center py-8 flex-1 flex items-center justify-center dark:text-slate-300">
              오늘 예정된 일정이 없습니다.
            </div>
          )}
        </div>

        {/* 5번 박스: 최근 활동 (왼쪽 하단) */}
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-lg hover:shadow-xl transition-shadow min-h-[400px] flex flex-col dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-6">
            <svg
              className="w-5 h-5 text-teal-600 dark:text-teal-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">최근 활동</h3>
          </div>

          <div className="space-y-3 flex-1 min-h-[340px]">
            {/* 최근 활동 목록 (최대 5개, 작업만) */}
            {recentItems.map((item) => {
              if (item.type === "task") {
                const task = item.data;
                const timeStr = formatDateTime(task.dueDate);
                
                // 작업 상태를 한글로 변환 및 스타일 결정 (2번 이미지와 동일한 스타일)
                const getStatusInfo = (status) => {
                  if (!status) {
                    return {
                      text: "대기",
                      bgClass: "bg-amber-100 border border-amber-300 dark:bg-yellow-800/90 dark:border-yellow-600/50",
                      textClass: "text-amber-800 dark:text-yellow-200",
                    };
                  }
                  
                  switch (status.toUpperCase()) {
                    case "WAITING":
                      return {
                        text: "대기",
                        bgClass: "bg-amber-100 border border-amber-300 dark:bg-yellow-800/90 dark:border-yellow-600/50",
                        textClass: "text-amber-800 dark:text-yellow-200",
                      };
                    case "IN_PROGRESS":
                    case "INPROGRESS":
                    case "PROGRESS":
                      return {
                        text: "진행중",
                        bgClass: "bg-blue-100 border border-blue-300 dark:bg-blue-800/90 dark:border-blue-600/50",
                        textClass: "text-blue-800 dark:text-blue-200",
                      };
                    case "DONE":
                      return {
                        text: "완료",
                        bgClass: "bg-emerald-100 border border-emerald-300 dark:bg-green-800/90 dark:border-green-600/50",
                        textClass: "text-emerald-800 dark:text-green-200",
                      };
                    case "SUCCESS":
                      return {
                        text: "성공",
                        bgClass: "bg-emerald-100 border border-emerald-300 dark:bg-green-800/90 dark:border-green-600/50",
                        textClass: "text-emerald-800 dark:text-green-200",
                      };
                    case "FAILED":
                      return {
                        text: "실패",
                        bgClass: "bg-red-100 border border-red-300 dark:bg-red-800/90 dark:border-red-600/50",
                        textClass: "text-red-800 dark:text-red-200",
                      };
                    default:
                      return {
                        text: status,
                        bgClass: "bg-slate-100 border border-slate-300 dark:bg-slate-700/90 dark:border-slate-500/50",
                        textClass: "text-slate-800 dark:text-slate-200",
                      };
                  }
                };
                
                const statusInfo = getStatusInfo(task.status);
                
                return (
                  <div
                    key={`task-${task.taskId}`}
                    className="bg-slate-50 rounded-sm p-4 border border-slate-200 dark:bg-slate-700/30 dark:border-slate-600"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span
                          className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap ${statusInfo.bgClass} ${statusInfo.textClass}`}
                        >
                          {statusInfo.text}
                        </span>
                        <span className="text-sm text-slate-900 whitespace-nowrap dark:text-white">
                          [최근 작업]:
                        </span>
                        <span className="text-sm text-slate-900 truncate dark:text-white">
                          {task.title || "작업 제목 없음"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {timeStr && (
                          <span className="text-xs text-slate-600 whitespace-nowrap dark:text-slate-400">
                            {timeStr}
                          </span>
                        )}
                        <button
                          onClick={() => navigateToTask('WAITING,IN_PROGRESS')}
                          className="text-sm text-teal-600 hover:text-teal-700 whitespace-nowrap dark:text-white dark:hover:text-teal-300"
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
            <div className="text-sm text-slate-500 text-center py-8 flex-1 flex items-center justify-center dark:text-slate-300">
              최근 활동이 없습니다.
            </div>
          )}
        </div>

        {/* 6번 박스: 그룹 현황 (오른쪽 하단) */}
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-lg hover:shadow-xl transition-shadow min-h-[400px] flex flex-col dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-teal-600 dark:text-teal-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">그룹 현황</h3>
            </div>
            <button
              onClick={navigateToCareTargetGroup}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 border border-teal-600 rounded text-teal-600 hover:border-teal-600 hover:bg-slate-200 transition-colors dark:bg-slate-900 dark:border-teal-400/50 dark:text-teal-400 dark:hover:border-teal-400 dark:hover:bg-slate-800"
            >
              <span className="text-teal-600 font-medium dark:text-teal-400">그룹 확인</span>
            </button>
          </div>

          <div className="space-y-3 flex-1 min-h-[340px]">
            {/* 그룹 목록 */}
            {careGroups.map((group) => (
              <div
                key={group.groupId}
                className="bg-slate-50 rounded-sm p-4 border border-slate-200 dark:bg-slate-700/30 dark:border-slate-600"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-900 truncate dark:text-white">
                    {group.groupName || "그룹명 없음"}
                  </span>
                  <span className="text-sm text-slate-900 flex-shrink-0 dark:text-white">
                    {group.careTargetCount || 0}명
                  </span>
                </div>
              </div>
            ))}
          </div>

          {careGroups.length === 0 && !loading && (
            <div className="text-sm text-slate-500 text-center py-8 flex-1 flex items-center justify-center dark:text-slate-300">
              등록된 그룹이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
