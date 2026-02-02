import { useState } from 'react';
import { AutoSizer, Table, Column } from 'react-virtualized';
import 'react-virtualized/styles.css';

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

  // 가상 스크롤을 위한 row getter
  const getRow = ({ index }) => {
    return notifications[index];
  };

  // 각 컬럼의 cell renderer
  const severityCellRenderer = ({ rowData }) => {
    if (!rowData) return null;
    const severityBadge = getSeverityBadge(rowData.severity);
    return (
      <div className="px-4 py-3 whitespace-nowrap h-full flex items-center">
        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${severityBadge.color}`}>
          {severityBadge.label}
        </span>
      </div>
    );
  };

  const titleCellRenderer = ({ rowData }) => {
    if (!rowData) return null;
    return (
      <div className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap truncate h-full flex items-center">
        {rowData.title || '-'}
      </div>
    );
  };

  const descriptionCellRenderer = ({ rowData }) => {
    if (!rowData) return null;
    return (
      <div className="px-4 py-3 text-sm text-gray-600 truncate h-full flex items-center">
        {rowData.description || '-'}
      </div>
    );
  };

  const careTargetCellRenderer = ({ rowData }) => {
    if (!rowData) return null;
    return (
      <div className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap h-full flex items-center">
        {rowData.careTarget?.name || '-'}
      </div>
    );
  };

  const typeCellRenderer = ({ rowData }) => {
    if (!rowData) return null;
    return (
      <div className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap h-full flex items-center">
        {getTypeLabel(rowData.type)}
      </div>
    );
  };

  const occurredAtCellRenderer = ({ rowData }) => {
    if (!rowData) return null;
    return (
      <div className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap h-full flex items-center">
        {formatDateTime(rowData.occurredAt)}
      </div>
    );
  };

  const statusCellRenderer = ({ rowData }) => {
    if (!rowData) return null;
    const isUnread = rowData.status === 'ACTIVE';
    return (
      <div className="px-4 py-3 text-sm whitespace-nowrap h-full flex items-center">
        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
          isUnread 
            ? 'bg-blue-100 text-blue-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {getStatusLabel(rowData.status)}
        </span>
      </div>
    );
  };

  const actionCellRenderer = ({ rowData }) => {
    if (!rowData) return null;
    const isUnread = rowData.status === 'ACTIVE';
    return (
      <div className="px-4 py-3 text-center whitespace-nowrap h-full flex items-center justify-center">
        {isUnread ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleConfirm(e, rowData.notificationId);
            }}
            className="px-3 py-1.5 bg-teal-500 text-white text-xs font-bold rounded hover:bg-teal-600 transition-colors shadow-sm"
          >
            확인
          </button>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400">확인완료</span>
            <span className="text-xs text-gray-600 font-medium">{rowData.resolvedBy?.name || '시스템'}</span>
          </div>
        )}
      </div>
    );
  };

  const rowClassName = ({ index }) => {
    if (index < 0 || index >= notifications.length) return '';
    const notification = notifications[index];
    const isUnread = notification?.status === 'ACTIVE';
    return `hover:bg-gray-50 transition-colors cursor-pointer ${isUnread ? 'bg-teal-50/20' : ''}`;
  };

  const headerRenderer = ({ label, columnData }) => {
    return (
      <div className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase bg-gray-50 border-b border-gray-200 h-full flex items-center">
        {label}
      </div>
    );
  };

  // 동적 row height 계산 (내용에 따라)
  const getRowHeight = ({ index }) => {
    return 60; // 고정 높이
  };

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-4 py-8 text-center text-gray-500">
          알림이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div style={{ height: '600px', width: '100%' }}>
        <AutoSizer>
          {({ height, width }) => (
            <Table
              width={width}
              height={height}
              headerHeight={48}
              rowHeight={getRowHeight}
              rowCount={notifications.length}
              rowGetter={getRow}
              rowClassName={rowClassName}
              onRowClick={({ rowData }) => handleRowClick(rowData)}
              overscanRowCount={5}
              gridStyle={{ outline: 'none' }}
            >
              <Column
                label="심각도"
                dataKey="severity"
                width={100}
                cellRenderer={severityCellRenderer}
                headerRenderer={headerRenderer}
              />
              <Column
                label="제목"
                dataKey="title"
                width={200}
                cellRenderer={titleCellRenderer}
                headerRenderer={headerRenderer}
              />
              <Column
                label="설명"
                dataKey="description"
                width={300}
                cellRenderer={descriptionCellRenderer}
                headerRenderer={headerRenderer}
                flexGrow={1}
              />
              <Column
                label="케어대상자"
                dataKey="careTarget"
                width={150}
                cellRenderer={careTargetCellRenderer}
                headerRenderer={headerRenderer}
              />
              <Column
                label="유형"
                dataKey="type"
                width={120}
                cellRenderer={typeCellRenderer}
                headerRenderer={headerRenderer}
              />
              <Column
                label="발생시간"
                dataKey="occurredAt"
                width={200}
                cellRenderer={occurredAtCellRenderer}
                headerRenderer={headerRenderer}
              />
              <Column
                label="상태"
                dataKey="status"
                width={100}
                cellRenderer={statusCellRenderer}
                headerRenderer={headerRenderer}
              />
              <Column
                label="작업"
                dataKey="action"
                width={120}
                cellRenderer={actionCellRenderer}
                headerRenderer={({ label }) => (
                  <div className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase bg-gray-50 border-b border-gray-200 h-full flex items-center justify-center">
                    {label}
                  </div>
                )}
              />
            </Table>
          )}
        </AutoSizer>
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
