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
import { noticeApi } from "../../api/noticeApi";
import { makeCallTest } from "../../api/callApi";
import { 
  Phone, 
  AlertCircle, 
  ClipboardList, 
  Bell, 
  Calendar, 
  Activity, 
  Users, 
  ChevronRight,
  Clock,
  CheckCircle2,
  TrendingUp,
  UserPlus,
  Megaphone
} from "lucide-react";

function DashboardPage() {
  const { user } = useAuth();
  const {
    navigateToCall,
    navigateToCareTarget,
    navigateToTask,
    navigateToNotification,
    navigateToCareTargetDetail,
    navigateToCareTargetGroup,
    navigateToNoticeDetail,
    navigateToCallSchedule,
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
  const [latestNotice, setLatestNotice] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

        // 즉시 조치 필요 항목 통합 조회
        const urgentItemsList = await getUrgentItems(
          currentOrgId,
          currentUserId,
        );
        setUrgentItems(urgentItemsList || []);

        // 오늘의 일정
        const todaySchedulesList = await getTodaySchedules(currentOrgId);
        setTodaySchedules(todaySchedulesList || []);

        // 최근 활동 통합 조회
        const recentItemsList = await getRecentItems(
          currentOrgId,
          currentUserId,
        );
        setRecentItems(recentItemsList || []);

        // 그룹 현황 조회
        const groupsList = await getCareGroupList(currentOrgId);
        setCareGroups(groupsList || []);

        // 최근 공지사항 조회
        const noticeRes = await noticeApi.getNotices(0, 1);
        if (noticeRes.data && noticeRes.data.content && noticeRes.data.content.length > 0) {
          setLatestNotice(noticeRes.data.content[0]);
        }
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
    <div className="space-y-8">
      <Breadcrumb items={["대시보드"]} />
      
      {/* 1. 상단 지표 카드 - 더 입체적이고 현대적인 디자인 */}
      {/* 1150px 이내에서는 2x2, 그 이상에서는 4개 한 줄 배치 */}
      <div className="grid dashboard-top-grid gap-6">
        {/* 통화 카드 */}
        <div
          className="group bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border p-6 shadow-lg hover:shadow-teal-500/10 hover:border-teal-500 transition-all cursor-pointer rounded-xl relative overflow-hidden"
          onClick={() => {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            navigateToCall(todayStr);
          }}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-teal-500/10 border border-teal-500/20 text-teal-500 shadow-inner  transition-all">
              <Phone size={28} />
            </div>
            <div>
              <p className="text-sm font-black text-cp-muted uppercase tracking-widest mb-1">오늘 통화</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-cp-text tracking-tighter">{callStats.todayTotal || 0}</span>
                <span className="text-sm font-bold text-teal-500">{callStats.todaySuccessRate || 0}% 성공</span>
              </div>
            </div>
          </div>
        </div>

        {/* 위험 카드 */}
        <div
          className="group bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border p-6 shadow-lg hover:shadow-red-500/10 hover:border-red-500 transition-all cursor-pointer rounded-xl relative overflow-hidden"
          onClick={navigateToCareTarget}
        >
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-500 shadow-inner  transition-all">
              <AlertCircle size={28} />
            </div>
            <div>
              <p className="text-sm font-black text-cp-muted uppercase tracking-widest mb-1">위험 대상</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-cp-text tracking-tighter">{riskStats.total || 0}</span>
                <span className="text-sm font-bold text-red-500">긴급 {riskStats.urgent || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 작업 카드 */}
        <div
          className="group bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border p-6 shadow-lg hover:shadow-teal-500/10 hover:border-teal-500 transition-all cursor-pointer rounded-xl relative overflow-hidden"
          onClick={() => navigateToTask('WAITING,IN_PROGRESS')}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-teal-500/10 border border-teal-500/20 text-teal-500 shadow-inner  transition-all">
              <ClipboardList size={28} />
            </div>
            <div>
              <p className="text-sm font-black text-cp-muted uppercase tracking-widest mb-1">진행 작업</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-cp-text tracking-tighter">{taskStats.total || 0}</span>
                <span className="text-sm font-bold text-amber-500">대기 {taskStats.waiting || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 알림 카드 */}
        <div
          className="group bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border p-6 shadow-lg hover:shadow-teal-500/10 hover:border-teal-500 transition-all cursor-pointer rounded-xl relative overflow-hidden"
          onClick={navigateToNotification}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-teal-500/10 border border-teal-500/20 text-teal-500 shadow-inner  transition-all">
              <Bell size={28} />
            </div>
            <div>
              <p className="text-sm font-black text-cp-muted uppercase tracking-widest mb-1">새 알림</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-cp-text tracking-tighter">{notificationStats.total || 0}</span>
                <span className="text-sm font-bold text-amber-500">미처리 {notificationStats.unprocessed || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 메인 대시보드 레이아웃 - 행 기반 정렬 시스템 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* [첫 번째 행] 즉시 조치 필요(8) vs 현재시간+오늘의 일정(4) */}
        <div className="lg:col-span-8">
          <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-none shadow-xl overflow-hidden flex flex-col h-full min-h-[450px]">
            <div className="px-6 py-5 border-b border-cp-border bg-cp-bg/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-6 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                <h3 className="text-lg font-black text-cp-text tracking-tight uppercase">즉시 조치 필요</h3>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[500px] modal-scrollbar flex-1">
              {urgentItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-40">
                  <CheckCircle2 size={48} className="text-cp-muted mb-4" />
                  <p className="text-sm font-bold text-cp-muted">모든 항목이 처리되었습니다.</p>
                </div>
              ) : (
                urgentItems.map((item) => {
                  let icon = <AlertCircle size={18} />;
                  let typeText = "긴급";
                  let colorClass = "text-red-500 bg-red-500/10 border-red-500/20";
                  
                  if (item.type === "patient") {
                    icon = <Users size={18} />;
                    typeText = "긴급 대상자";
                  } else if (item.type === "task") {
                    icon = <ClipboardList size={18} />;
                    typeText = "대기 작업";
                    colorClass = "text-amber-500 bg-amber-500/10 border-amber-500/20";
                  } else if (item.type === "notification") {
                    icon = <Bell size={18} />;
                    typeText = "긴급 알림";
                  }

                  return (
                    <div key={`${item.type}-${item.id}`} className="group flex items-center justify-between p-4 rounded-lg bg-cp-bg/40 border border-cp-border hover:border-teal-500/30 hover:bg-cp-bg transition-all shadow-sm">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorClass}`}>
                          {icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-cp-muted uppercase tracking-tighter mb-0.5">{typeText}</p>
                          <p className="text-base font-bold text-cp-text truncate">
                            {item.data.name || item.data.title || item.data.description || "상세 정보 없음"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex flex-col items-end mr-2">
                          <span className="text-sm font-bold text-cp-muted flex items-center gap-1">
                            <Clock size={14} /> {item.formattedTime || "시간 정보 없음"}
                          </span>
                        </div>
                        
                        {item.type === 'patient' && (
                          <>
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                const now = new Date().toISOString().slice(0, 19);
                                try {
                                  await makeCallTest({ to: item.data.careTargetPhone, scheduledTime: now });
                                  alert(`${item.data.name}님에게 통화를 연결합니다.`);
                                } catch (error) {
                                  alert("통화 요청 중 오류가 발생했습니다.");
                                }
                              }}
                              className="flex items-center gap-1.5 bg-cp-input text-green-400 px-3 py-1.5 font-semibold transition-all border border-green-500/50 whitespace-nowrap text-[11px] shadow-md"
                            >
                              <Phone size={14} />
                              <span>통화하기</span>
                            </button>
                            <button 
                              onClick={() => navigateToCareTargetDetail(item.data.careTargetId)}
                              className="flex items-center gap-1.5 bg-cp-input hover:bg-cp-bg text-teal-400 px-3 py-1.5 font-semibold transition-all border border-teal-500/50 hover:border-teal-500 whitespace-nowrap text-[11px] shadow-md hover:-translate-y-0.5"
                            >
                              <ChevronRight size={14} />
                              <span>상세보기</span>
                            </button>
                          </>
                        )}

                        {item.type === 'task' && (
                          <button 
                            onClick={() => navigateToTask()}
                            className="flex items-center gap-1.5 bg-cp-input hover:bg-cp-bg text-amber-500 px-3 py-1.5 font-semibold transition-all border border-amber-500/50 hover:border-amber-500 whitespace-nowrap text-[11px] shadow-md hover:-translate-y-0.5"
                          >
                            <ClipboardList size={14} />
                            <span>상세보기</span>
                          </button>
                        )}

                        {item.type === 'notification' && (
                          <button 
                            onClick={() => navigateToNotification()}
                            className="flex items-center gap-1.5 bg-cp-input hover:bg-cp-bg text-teal-400 px-3 py-1.5 font-semibold transition-all border border-teal-500/50 hover:border-teal-500 whitespace-nowrap text-[11px] shadow-md hover:-translate-y-0.5"
                          >
                            <Bell size={14} />
                            <span>알림확인</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* 현재 상태 및 최근 공지사항 박스 */}
          <div 
            onClick={() => latestNotice && navigateToNoticeDetail(latestNotice.noticeId)} // 공지사항 상세 페이지로 이동
            className={`bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-none shadow-xl p-5 flex flex-col justify-between overflow-hidden relative group h-[120px] transition-all ${latestNotice ? 'cursor-pointer hover:border-teal-500/50 hover:shadow-teal-500/10' : ''}`}
          >
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-teal-500/5 rounded-full group-hover:scale-125 transition-transform duration-500" />
            
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-xs font-black text-teal-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
                  공지사항
                </p>
                <h4 className="text-base font-bold text-cp-text truncate max-w-[240px]">
                  {latestNotice ? latestNotice.title : "공지사항이 없습니다."}
                </h4>
              </div>
              
            </div>

            <div className="relative z-10 mt-auto">
              {latestNotice ? (
                <p className="text-sm text-cp-muted line-clamp-1 opacity-80">
                  {latestNotice.content.replace(/<[^>]*>?/gm, '')}
                </p>
              ) : (
                <p className="text-sm text-cp-muted italic">최근 등록된 소식이 없습니다.</p>
              )}
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm font-bold text-cp-muted/50">
                  {latestNotice ? formatDateTime(latestNotice.createdAt) : formatDateTime(now)}
                </span>
                {latestNotice && (
                  <span className="text-sm font-black text-teal-500 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                    보기 <ChevronRight size={14} />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 오늘의 일정 */}
          <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-none shadow-xl overflow-hidden flex flex-col flex-1 min-h-[300px]">
            <div className="px-6 py-5 border-b border-cp-border bg-cp-bg/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-teal-500" />
                <h3 className="text-lg font-black text-cp-text tracking-tight uppercase">오늘의 일정</h3>
              </div>
              <button onClick={navigateToCallSchedule} className="text-[10px] font-black text-teal-500 hover:underline">통화 스케줄 보기</button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[350px] modal-scrollbar flex-1">
              {todaySchedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-10 opacity-30">
                  <Calendar size={40} className="text-cp-muted mb-2" />
                  <p className="text-sm font-bold">일정 없음</p>
                </div>
              ) : (
                todaySchedules.map((schedule) => {
                  const statusText = schedule.displayStatus?.replace('[', '').replace(']', '') || "예정";
                  let statusColor = "text-teal-500 bg-teal-500/10 border-teal-500/20";
                  
                  if (statusText === "진행중") {
                    statusColor = "text-blue-500 bg-blue-500/10 border-blue-500/20";
                  } else if (statusText === "완료") {
                    statusColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
                  }

                  return (
                    <div 
                      key={schedule.scheduleId} 
                      className="group relative pl-4 border-l-2 border-teal-500/30 hover:border-teal-500 transition-all py-2 flex items-center justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-teal-500">{schedule.formattedTime}</span>
                          <span className="px-1.5 py-0.5 rounded bg-cp-bg border border-cp-border text-[11px] font-black text-cp-muted uppercase">
                          {schedule.scheduleType === "ONE_TIME" ? "단발성 통화" : "정기통화"}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded border text-[11px] font-black uppercase ${statusColor}`}>
                            {statusText}
                          </span>
                        </div>
                        <p className="text-base font-bold text-cp-text truncate leading-tight">
                          {schedule.careTargetName || schedule.targetGroupName || "대상자 없음"}
                        </p>
                      </div>

                    <div className="flex items-center gap-1.5 ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {schedule.careTargetPhone && (
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            const now = new Date().toISOString().slice(0, 19);
                            try {
                              await makeCallTest({ to: schedule.careTargetPhone, scheduledTime: now });
                              alert(`${schedule.careTargetName}님에게 통화를 연결합니다.`);
                            } catch (error) {
                              alert("통화 요청 중 오류가 발생했습니다.");
                            }
                          }}
                          className="p-1.5 bg-cp-input text-green-400 border border-green-500/50 rounded-sm shadow-sm transition-all"
                          title="통화하기"
                        >
                          <Phone size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          </div>
        </div>
      </div>

      {/* [두 번째 행] 최근 활동 로그(8) vs 그룹 관리(4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8">
          <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-none shadow-xl overflow-hidden min-h-[300px] h-full flex flex-col">
            <div className="px-6 py-5 border-b border-cp-border bg-cp-bg/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-6 bg-teal-500 rounded-full" />
                <h3 className="text-lg font-black text-cp-text tracking-tight uppercase">미처리 업무 현황</h3>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              {recentItems.length === 0 ? (
                <p className="col-span-2 text-center py-10 text-cp-muted font-bold text-sm">기록된 활동이 없습니다.</p>
              ) : (
                recentItems.map((item) => {
                  const task = item.data;
                  const timeStr = formatDateTime(task.dueDate || task.createdAt);
                  
                  // 상태 텍스트 및 스타일 설정
                  let statusText = "대기";
                  let statusColor = "text-amber-500 bg-amber-500/10 border-amber-500/20";
                  
                  if (task.status === "PROGRESS" || task.status === "IN_PROGRESS") {
                    statusText = "진행중";
                    statusColor = "text-blue-500 bg-blue-500/10 border-blue-500/20";
                  } else if (task.status === "COMPLETED") {
                    statusText = "완료";
                    statusColor = "text-teal-500 bg-teal-500/10 border-teal-500/20";
                  }

                  return (
                    <div key={`recent-${task.taskId}`} className="flex items-center gap-3 p-3 rounded-lg bg-cp-bg/30 border border-cp-border/50 hover:bg-cp-bg/50 transition-all group">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-1.5 py-0.5 rounded text-[11px] font-black border uppercase ${statusColor}`}>
                            {statusText}
                          </span>
                          <span className="text-sm font-bold text-cp-muted">{timeStr}</span>
                        </div>
                        <p className="text-base font-bold text-cp-text truncate">{task.title}</p>
                      </div>
                      
                      <button 
                        onClick={() => navigateToTask()}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-cp-input hover:bg-cp-bg text-teal-400 px-2.5 py-1.5 font-bold transition-all border border-teal-500/50 hover:border-teal-500 whitespace-nowrap text-[10px] shadow-sm hover:-translate-y-0.5"
                      >
                        처리하기
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-none shadow-xl overflow-hidden flex flex-col h-full min-h-[300px]">
            <div className="px-6 py-5 border-b border-cp-border bg-cp-bg/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users size={20} className="text-teal-500" />
                <h3 className="text-lg font-black text-cp-text tracking-tight uppercase">그룹 관리</h3>
              </div>
            </div>
            <div className="p-6 space-y-3 overflow-y-auto max-h-[300px] modal-scrollbar flex-1">
              {careGroups.length === 0 ? (
                <p className="text-center py-10 text-cp-muted font-bold text-sm">등록된 그룹이 없습니다.</p>
              ) : (
                careGroups.map((group) => (
                  <div key={group.groupId} className="flex items-center justify-between p-3 rounded-lg bg-cp-bg/30 border border-cp-border/50 hover:border-teal-500/20 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded bg-teal-500/5 border border-teal-500/10 flex items-center justify-center text-teal-500">
                        <span className="text-xs font-black">{group.groupName?.charAt(0)}</span>
                      </div>
                      <span className="text-sm font-bold text-cp-text truncate">{group.groupName}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-cp-bg border border-cp-border text-xs font-black text-teal-500">{group.careTargetCount || 0}명</span>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-cp-border bg-cp-bg/20">
              <button 
                onClick={navigateToCareTargetGroup}
                className="w-full py-2.5 rounded-lg bg-teal-500 text-white text-xs font-black hover:bg-teal-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
              >
                <UserPlus size={14} /> 전체 그룹 확인
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default DashboardPage;
