import { useState } from 'react';

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
  const [selectedNotification, setSelectedNotification] = useState(null);

  const handleRowClick = (notification) => {
    setSelectedNotification(notification);
  };

  const closeModal = () => {
    setSelectedNotification(null);
  };

  const handleConfirm = (e, notificationId) => {
    e.stopPropagation(); // 행 클릭(상세보기) 이벤트 전파 방지
    if (onMarkAsRead) {
      onMarkAsRead(notificationId, currentUserId);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] table-fixed">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-24 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">심각도</th>
              <th className="w-48 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">제목</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">설명</th>
              <th className="w-32 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">케어대상자</th>
              <th className="w-28 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">유형</th>
              <th className="w-44 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">발생시간</th>
              <th className="w-24 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">상태</th>
              <th className="w-28 px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {notifications.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
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
                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                      isUnread ? 'bg-teal-50/20' : ''
                    }`}
                    onClick={() => handleRowClick(notification)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${severityBadge.color}`}>
                        {severityBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap truncate">
                      {notification.title || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 truncate">
                      {notification.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {notification.careTarget?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {getTypeLabel(notification.type)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {formatDateTime(notification.occurredAt)}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        isUnread 
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {getStatusLabel(notification.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {isUnread ? (
                        <button
                          onClick={(e) => handleConfirm(e, notification.notificationId)}
                          className="px-3 py-1.5 bg-teal-500 text-white text-xs font-bold rounded hover:bg-teal-600 transition-colors shadow-sm"
                        >
                          확인
                        </button>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-gray-400">확인완료</span>
                          <span className="text-xs text-gray-600 font-medium">{notification.resolvedBy?.name || '시스템'}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 상세 보기 모달 */}
      {selectedNotification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">알림 상세 내역</h3>
              <button 
                onClick={closeModal} 
                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl p-1"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded text-xs font-bold border ${getSeverityBadge(selectedNotification.severity).color}`}>
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
                <label className="text-[11px] font-bold text-teal-600 uppercase tracking-wider block mb-1.5">알림 제목</label>
                <p className="text-lg font-bold text-gray-900 leading-tight">{selectedNotification.title}</p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-teal-600 uppercase tracking-wider block mb-1.5">상세 내용</label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed min-h-[120px]">
                  {selectedNotification.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">케어대상자</label>
                  <p className="text-sm font-bold text-gray-800">{selectedNotification.careTarget?.name || '-'}</p>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">상태</label>
                  <p className="text-sm font-bold text-gray-800">{getStatusLabel(selectedNotification.status)}</p>
                </div>
              </div>

              {selectedNotification.status === 'RESOLVED' && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-green-700 font-bold">✓ 확인 완료</span>
                    <span className="text-green-600">{formatDateTime(selectedNotification.resolvedAt)}</span>
                  </div>
                  <p className="text-sm text-green-800 mt-1 font-medium">
                    {selectedNotification.resolvedBy?.name} 님이 확인하였습니다.
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              {selectedNotification.status === 'ACTIVE' && (
                <button
                  onClick={(e) => {
                    handleConfirm(e, selectedNotification.notificationId);
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

export default NotificationTable;
