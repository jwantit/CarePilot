/**
 * 알림 테이블 컴포넌트
 */
const getSeverityBadge = (severity) => {
  const severityMap = {
    CRITICAL: { label: '긴급', color: 'bg-red-100 text-red-700 border-red-300' },
    HIGH: { label: '높음', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    MEDIUM: { label: '보통', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    LOW: { label: '낮음', color: 'bg-green-100 text-green-700 border-green-300' },
  };
  return severityMap[severity] || { label: severity || '-', color: 'bg-gray-100 text-gray-700 border-gray-300' };
};

const getTypeLabel = (type) => {
  const typeMap = {
    VITAL_SIGN: '생체신호',
    EMERGENCY: '긴급',
    MEDICATION: '약물',
    CALL: '통화',
    RISK_DETECTION: '위험감지',
    SCHEDULE: '스케줄',
    OTHER: '기타',
  };
  return typeMap[type] || type;
};

const getStatusLabel = (status) => {
  const statusMap = {
    ACTIVE: '활성',
    PROCESSING: '처리중',
    RESOLVED: '해결됨',
  };
  return statusMap[status] || status;
};

const formatDateTime = (dateString) => {
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

function NotificationTable({ notifications, onMarkAsRead, currentUserId }) {
  const handleRowClick = (notification) => {
    if (notification.status === 'ACTIVE' && onMarkAsRead) {
      onMarkAsRead(notification.notificationId, currentUserId);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">심각도</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">제목</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">설명</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">유형</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">발생시간</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">상태</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {notifications.length === 0 ? (
            <tr>
              <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                알림이 없습니다.
              </td>
            </tr>
          ) : (
            notifications.map((notification) => {
              const severityBadge = getSeverityBadge(notification.severity);
              const isUnread = notification.status === 'ACTIVE';
              
              return (
                <tr
                  key={notification.notificationId}
                  className={`hover:bg-gray-50 transition-colors ${
                    isUnread ? 'bg-teal-50/30 cursor-pointer' : ''
                  }`}
                  onClick={() => handleRowClick(notification)}
                >
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${severityBadge.color}`}>
                      {severityBadge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {notification.title || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-md truncate">
                    {notification.description || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {getTypeLabel(notification.type)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDateTime(notification.occurredAt)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      notification.status === 'ACTIVE' 
                        ? 'bg-blue-100 text-blue-700'
                        : notification.status === 'PROCESSING'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {getStatusLabel(notification.status)}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default NotificationTable;

