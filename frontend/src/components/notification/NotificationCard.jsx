
/**
 * 알림 타입별 색상 및 라벨
 */
const getNotificationTypeInfo = (type) => {
  const typeMap = {
    VITAL_SIGN: { color: 'bg-red-500/20 text-red-400', label: '생체신호' },
    EMERGENCY: { color: 'bg-red-500/20 text-red-400', label: '긴급' },
    MEDICATION: { color: 'bg-blue-500/20 text-blue-400', label: '약물' },
    CALL: { color: 'bg-green-500/20 text-green-400', label: '통화' },
    RISK_DETECTION: { color: 'bg-yellow-500/20 text-yellow-400', label: '위험감지' },
    SCHEDULE: { color: 'bg-purple-500/20 text-purple-400', label: '스케줄' },
    OTHER: { color: 'bg-cp-bg/50 text-cp-text', label: '기타' },
  };
  return typeMap[type] || typeMap.OTHER;
};

/**
 * 위험도별 색상
 */
const getSeverityColor = (severity) => {
  const severityMap = {
    LOW: 'text-green-400',
    MEDIUM: 'text-yellow-400',
    HIGH: 'text-orange-400',
    CRITICAL: 'text-red-400',
  };
  return severityMap[severity] || 'text-cp-muted';
};

/**
 * 날짜 포맷팅
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const diffMinutes = Math.floor(diff / 60000);
    const diffHours = Math.floor(diff / 3600000);
    const diffDays = Math.floor(diff / 86400000);

    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    
    // 7일 이상 지난 경우: yyyy년 MM월 dd일 HH:mm 형식
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateHours = String(date.getHours()).padStart(2, '0');
    const dateMinutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일 ${dateHours}:${dateMinutes}`;
  } catch (error) {
    return dateString;
  }
};

function NotificationCard({ notification, onMarkAsRead, currentUserId }) {
  const typeInfo = getNotificationTypeInfo(notification.type);
  const isUnread = notification.status === 'ACTIVE';
  const severityColor = notification.severity ? getSeverityColor(notification.severity) : '';

  const handleClick = () => {
    if (isUnread && onMarkAsRead) {
      onMarkAsRead(notification.notificationId, currentUserId);
    }
  };

  return (
    <div
      className={`p-4 rounded-none border transition-all cursor-pointer ${
        isUnread
          ? 'bg-teal-500/10 border-teal-500/30 hover:bg-teal-500/20 hover:shadow-md'
          : 'bg-cp-card border-cp-border hover:bg-cp-bg/50'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-semibold ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
            {notification.severity && (
              <span className={`text-xs font-semibold ${severityColor}`}>
                {notification.severity}
              </span>
            )}
            {isUnread && (
              <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
            )}
          </div>
          
          <h3 className={`text-base font-semibold mb-1 text-cp-text`}>
            {notification.title}
          </h3>
          
          <p className="text-sm text-cp-muted mb-2 line-clamp-2">
            {notification.description}
          </p>
          
          <div className="flex items-center justify-between text-xs text-cp-muted">
            <span>{formatDate(notification.occurredAt)}</span>
            {notification.status === 'RESOLVED' && (
              <span className="text-green-400">✓ 읽음</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationCard;
