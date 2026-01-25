import { useState, useEffect } from 'react';
import { useWebSocketContext } from '../../contexts/WebSocketContext';
import { getNotifications, getUnreadCount, markAsRead, createTestNotification } from '../../api/notificationApi';
import NotificationTable from '../../components/notification/NotificationTable';
import toast from 'react-hot-toast';

function NotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const [resolvedNotifications, setResolvedNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [filter, setFilter] = useState('active'); // 'active', 'all'
  
  // 임시로 userId를 1로 설정 (나중에 인증에서 가져오도록 수정)
  const currentUserId = 1;

  // 알림 목록 조회
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const allNotifications = await getNotifications(currentUserId);
      
      // 활성 알림 (ACTIVE, PROCESSING)
      const activeNotifications = (allNotifications || []).filter(
        n => n.status === 'ACTIVE' || n.status === 'PROCESSING'
      );
      
      // 해결된 알림 (RESOLVED)
      const resolvedList = (allNotifications || []).filter(
        n => n.status === 'RESOLVED'
      ).slice(0, 5); // 최근 5개만
      
      if (filter === 'active') {
        setNotifications(activeNotifications);
      } else {
        setNotifications(allNotifications || []);
      }
      
      setResolvedNotifications(resolvedList);
      
      // 통계 계산
      const active = (allNotifications || []).filter(n => n.status === 'ACTIVE').length;
      const warning = (allNotifications || []).filter(
        n => n.severity === 'HIGH' || n.severity === 'CRITICAL'
      ).length;
      const resolvedCount = (allNotifications || []).filter(n => n.status === 'RESOLVED').length;
      
      setActiveCount(active);
      setWarningCount(warning);
      setResolvedCount(resolvedCount);
      
      // 읽지 않은 알림 개수 조회
      const count = await getUnreadCount(currentUserId);
      setUnreadCount(count);
    } catch (error) {
      console.error('알림 조회 실패:', error);
      toast.error('알림을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 알림 읽음 처리
  const handleMarkAsRead = async (notificationId, userId) => {
    try {
      await markAsRead(notificationId, userId);
      toast.success('알림을 읽음 처리했습니다.');
      // 목록 새로고침
      fetchNotifications();
      // 메뉴의 알림 개수 업데이트를 위한 이벤트 발생
      window.dispatchEvent(new CustomEvent('notification-updated'));
    } catch (error) {
      console.error('읽음 처리 실패:', error);
      toast.error('읽음 처리에 실패했습니다.');
    }
  };

  // WebSocket Context 사용 (전역 알림은 WebSocketContext에서 처리)
  const { sendMessage } = useWebSocketContext();
  
  // 알림 페이지에서만 목록 새로고침을 위한 이벤트 리스너
  useEffect(() => {
    const handleNotificationReceived = () => {
      fetchNotifications();
    };
    
    // 커스텀 이벤트 리스너 등록 (WebSocketContext에서 발생시킴)
    window.addEventListener('notification-received', handleNotificationReceived);
    
    return () => {
      window.removeEventListener('notification-received', handleNotificationReceived);
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
        'RISK_DETECTION',
        '낙상 위험 감지',
        '환자의 낙상 위험이 감지되었습니다.',
        'CRITICAL'
      );
      toast.success('테스트 알림이 생성되었습니다.');
      fetchNotifications();
    } catch (error) {
      console.error('테스트 알림 생성 실패:', error);
      toast.error('테스트 알림 생성에 실패했습니다.');
    }
  };

  const formatResolvedDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
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
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              filter === 'active'
                ? 'bg-teal-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            활성 알림
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-teal-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 왼쪽: 활성 알림 목록 */}
        <div className="col-span-2">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">활성 알림 목록</h2>
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
            <h2 className="text-xl font-semibold text-gray-800 mb-4">알림 통계 요약</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">활성 알림 수</span>
                <span className="text-lg font-semibold text-red-600">{activeCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">주의 알림 수</span>
                <span className="text-lg font-semibold text-orange-600">{warningCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">해결된 알림 수</span>
                <span className="text-lg font-semibold text-green-600">{resolvedCount}</span>
              </div>
            </div>
          </div>

          {/* 최근 해결된 알림 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">최근 해결된 알림</h2>
            {resolvedNotifications.length === 0 ? (
              <div className="text-sm text-gray-500">해결된 알림이 없습니다.</div>
            ) : (
              <div className="space-y-3">
                {resolvedNotifications.map((notification) => (
                  <div key={notification.notificationId} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {notification.title || '-'}
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
    </div>
  );
}

export default NotificationPage;