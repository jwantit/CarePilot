import { useState, useEffect } from "react";
import { useWebSocketContext } from "../../contexts/WebSocketContext";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  createTestNotification,
} from "../../api/notificationApi";
import { testRiskDetectionNotification } from "../../api/callApi";
import NotificationTable from "../../components/notification/NotificationTable";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

function NotificationPage() {
  const auth = useSelector((state) => state.auth);
  const currentUserId = auth.user?.userId;
  const [notifications, setNotifications] = useState([]);
  const [resolvedNotifications, setResolvedNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [filter, setFilter] = useState("active"); // 'active', 'all'
  const [selectedNotification, setSelectedNotification] = useState(null);

  // 알림 목록 조회
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const allNotifications = await getNotifications(currentUserId);

      // 활성 알림 (ACTIVE, PROCESSING)
      const activeNotifications = (allNotifications || []).filter(
        (n) => n.status === "ACTIVE" || n.status === "PROCESSING",
      );

      // 해결된 알림 (RESOLVED)
      const resolvedList = (allNotifications || [])
        .filter((n) => n.status === "RESOLVED")
        .slice(0, 5); // 최근 5개만

      if (filter === "active") {
        setNotifications(activeNotifications);
      } else {
        setNotifications(allNotifications || []);
      }

      setResolvedNotifications(resolvedList);

      // 통계 계산
      const active = (allNotifications || []).filter(
        (n) => n.status === "ACTIVE",
      ).length;
      const warning = (allNotifications || []).filter(
        (n) => n.severity === "HIGH" || n.severity === "CRITICAL",
      ).length;
      const resolvedCount = (allNotifications || []).filter(
        (n) => n.status === "RESOLVED",
      ).length;

      setActiveCount(active);
      setWarningCount(warning);
      setResolvedCount(resolvedCount);

      // 읽지 않은 알림 개수 조회
      const count = await getUnreadCount(currentUserId);
      setUnreadCount(count);
    } catch (error) {
      console.error("알림 조회 실패:", error);
      toast.error("알림을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 알림 읽음 처리
  const handleMarkAsRead = async (notificationId, userId) => {
    try {
      await markAsRead(notificationId, userId);
      toast.success("알림을 읽음 처리했습니다.");
      // 목록 새로고침
      fetchNotifications();
      // 메뉴의 알림 개수 업데이트를 위한 이벤트 발생
      window.dispatchEvent(new CustomEvent("notification-updated"));
    } catch (error) {
      console.error("읽음 처리 실패:", error);
      toast.error("읽음 처리에 실패했습니다.");
    }
  };

  // 상세 모달 닫기
  const closeModal = () => {
    setSelectedNotification(null);
  };

  // WebSocket Context 사용 (전역 알림은 WebSocketContext에서 처리)
  const { sendMessage } = useWebSocketContext();

  // 알림 페이지에서만 목록 새로고침을 위한 이벤트 리스너
  useEffect(() => {
    const handleNotificationReceived = () => {
      fetchNotifications();
    };

    // 커스텀 이벤트 리스너 등록 (WebSocketContext에서 발생시킴)
    window.addEventListener(
      "notification-received",
      handleNotificationReceived,
    );

    return () => {
      window.removeEventListener(
        "notification-received",
        handleNotificationReceived,
      );
    };
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  // 테스트 알림 생성 (개발용)
  const handleCreateTestNotification = async () => {
    try {
      await createTestNotification(
        currentUserId,
        "EMERGENCY",
        "긴급 알림 테스트",
        "긴급 상황이 발생했습니다.",
        "CRITICAL",
      );
      toast.success("테스트 알림이 생성되었습니다.");
      fetchNotifications();
    } catch (error) {
      console.error("테스트 알림 생성 실패:", error);
      toast.error("테스트 알림 생성에 실패했습니다.");
    }
  };

  // 위험 감지 알림 테스트 (개발용)
  const handleTestRiskDetection = async () => {
    const careTargetId = prompt("케어대상자 ID를 입력하세요:");
    if (!careTargetId) {
      return;
    }

    const riskScore = prompt("위험도 점수를 입력하세요 (기본값: 75):", "75");
    const riskLevel = prompt("위험 수준을 입력하세요 (LOW/MEDIUM/HIGH/CRITICAL, 기본값: HIGH):", "HIGH");

    try {
      const result = await testRiskDetectionNotification(
        parseInt(careTargetId),
        riskScore ? parseInt(riskScore) : 75,
        riskLevel || "HIGH",
      );
      
      if (result.success) {
        toast.success("위험 감지 알림이 생성되었습니다.");
        fetchNotifications();
      } else {
        toast.error(result.error || "위험 감지 알림 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("위험 감지 알림 테스트 실패:", error);
      toast.error(error.response?.data?.error || "위험 감지 알림 생성에 실패했습니다.");
    }
  };

  const formatResolvedDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (error) {
      return dateString;
    }
  };

  // 알림 상세 정보를 위한 헬퍼 함수들 (NotificationTable과 동일)
  const getSeverityBadge = (severity) => {
    const severityMap = {
      CRITICAL: {
        label: "긴급",
        color: "bg-red-100 text-red-700 border-red-300",
      },
      HIGH: {
        label: "높음",
        color: "bg-orange-100 text-orange-700 border-orange-300",
      },
      MEDIUM: {
        label: "보통",
        color: "bg-yellow-100 text-yellow-700 border-yellow-300",
      },
      LOW: {
        label: "낮음",
        color: "bg-green-100 text-green-700 border-green-300",
      },
    };
    return (
      severityMap[severity] || {
        label: severity || "-",
        color: "bg-gray-100 text-gray-700 border-gray-300",
      }
    );
  };

  const getTypeLabel = (type) => {
    const typeMap = {
      VITAL_SIGN: "생체신호",
      EMERGENCY: "긴급",
      MEDICATION: "약물",
      CALL: "통화",
      RISK_DETECTION: "위험감지",
      SCHEDULE: "스케줄",
      OTHER: "기타",
    };
    return typeMap[type] || type;
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      ACTIVE: "활성",
      PROCESSING: "처리중",
      RESOLVED: "해결됨",
    };
    return statusMap[status] || status;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">알림 관리</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("active")}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              filter === "active"
                ? "bg-teal-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            활성 알림
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              filter === "all"
                ? "bg-teal-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            전체
          </button>
          <button
            onClick={handleCreateTestNotification}
            className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 font-semibold"
          >
            테스트 알림 생성
          </button>
          <button
            onClick={handleTestRiskDetection}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 font-semibold"
          >
            위험 감지 알림 테스트
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 왼쪽: 활성 알림 목록 */}
        <div className="col-span-2">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              활성 알림 목록
            </h2>
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-gray-500">알림을 불러오는 중...</div>
            </div>
          ) : (
            <NotificationTable
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              currentUserId={currentUserId}
            />
          )}
        </div>

        {/* 오른쪽: 통계 + 최근 해결된 알림 */}
        <div className="space-y-6">
          {/* 알림 통계 요약 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              알림 통계 요약
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">활성 알림 수</span>
                <span className="text-lg font-semibold text-red-600">
                  {activeCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">주의 알림 수</span>
                <span className="text-lg font-semibold text-orange-600">
                  {warningCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">해결된 알림 수</span>
                <span className="text-lg font-semibold text-green-600">
                  {resolvedCount}
                </span>
              </div>
            </div>
          </div>

          {/* 최근 해결된 알림 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              최근 해결된 알림
            </h2>
            {resolvedNotifications.length === 0 ? (
              <div className="text-sm text-gray-500">
                해결된 알림이 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {resolvedNotifications.map((notification) => (
                  <div
                    key={notification.notificationId}
                    className="border-b border-gray-100 pb-3 last:border-0 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                    onClick={() => setSelectedNotification(notification)}
                  >
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {notification.title || "-"}
                    </div>
                    <div className="text-xs text-gray-500">
                      해결 시간: {formatResolvedDate(notification.resolvedAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 상세 보기 모달 (NotificationTable의 모달과 동일한 로직) */}
      {selectedNotification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">
                알림 상세 내역
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl p-1"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-1 rounded text-xs font-bold border ${getSeverityBadge(selectedNotification.severity).color}`}
                >
                  {getSeverityBadge(selectedNotification.severity).label}
                </span>
                <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs font-bold">
                  {getTypeLabel(selectedNotification.type)}
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  {formatDateTime(selectedNotification.occurredAt)}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-teal-600 uppercase tracking-wider block mb-1.5">
                  알림 제목
                </label>
                <p className="text-lg font-bold text-gray-900 leading-tight">
                  {selectedNotification.title}
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-teal-600 uppercase tracking-wider block mb-1.5">
                  상세 내용
                </label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed min-h-[120px]">
                  {selectedNotification.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    케어대상자
                  </label>
                  <p className="text-sm font-bold text-gray-800">
                    {selectedNotification.careTarget?.name || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    상태
                  </label>
                  <p className="text-sm font-bold text-gray-800">
                    {getStatusLabel(selectedNotification.status)}
                  </p>
                </div>
              </div>

              {selectedNotification.status === "RESOLVED" && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-green-700 font-bold">
                      ✓ 확인 완료
                    </span>
                    <span className="text-green-600">
                      {formatDateTime(selectedNotification.resolvedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-green-800 mt-1 font-medium">
                    {selectedNotification.resolvedBy?.name} 님이 확인하였습니다.
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              {selectedNotification.status === "ACTIVE" && (
                <button
                  onClick={async () => {
                    await handleMarkAsRead(
                      selectedNotification.notificationId,
                      currentUserId,
                    );
                    closeModal();
                  }}
                  className="px-5 py-2.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 font-bold shadow-sm transition-all active:scale-95"
                >
                  확인 처리하기
                </button>
              )}
              <button
                onClick={closeModal}
                className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-bold text-gray-700 transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationPage;
