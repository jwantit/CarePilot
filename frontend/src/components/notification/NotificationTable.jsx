import { useState } from 'react';
import { AutoSizer, Table, Column } from 'react-virtualized';
import 'react-virtualized/styles.css';
import { getSeverityBadge } from '../../utils/riskLevelStyles';

/**
 * 알림 테이블 컴포넌트
 */

const getTypeLabel = (type) => {
  const typeMap = {
    VITAL_SIGN: '생체신호',
    EMERGENCY: '긴급',
    MEDICATION: '약물',
    CALL: '통화',
    RISK_DETECTION: '위험감지',
    SCHEDULE: '스케줄',
    SIGNUP_APPROVAL: '회원가입',
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
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}`;
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
      <div className="px-4 py-3 whitespace-nowrap h-full flex items-center justify-center w-full">
        <span className={`inline-block px-2 py-1 rounded-sm text-[11px] font-black border ${severityBadge.color}`}>
          {severityBadge.label}
        </span>
      </div>
    );
  };

  const titleCellRenderer = ({ rowData }) => {
    if (!rowData) return null;
    return (
      <div className="px-4 py-3 text-sm text-cp-text h-full flex items-center justify-center w-full overflow-hidden">
        <span className="truncate">{rowData.title || '-'}</span>
      </div>
    );
  };

  const descriptionCellRenderer = ({ rowData }) => {
    if (!rowData) return null;
    return (
      <div className="px-4 py-3 text-sm text-cp-muted h-full flex items-center justify-center w-full overflow-hidden">
        <span className="truncate">{rowData.description || '-'}</span>
      </div>
    );
  };

  const careTargetCellRenderer = ({ rowData }) => {
    if (!rowData) return null;
    return (
      <div className="px-4 py-3 text-sm text-cp-text h-full flex items-center justify-center w-full overflow-hidden">
        <span className="truncate">{rowData.careTarget?.name || '-'}</span>
      </div>
    );
  };

  const typeCellRenderer = ({ rowData }) => {
    if (!rowData) return null;
    return (
      <div className="px-4 py-3 text-sm text-cp-text h-full flex items-center justify-center w-full overflow-hidden">
        <span className="truncate">{getTypeLabel(rowData.type)}</span>
      </div>
    );
  };

  const occurredAtCellRenderer = ({ rowData }) => {
    if (!rowData) return null;
    return (
      <div className="px-4 py-3 text-sm text-cp-muted whitespace-nowrap font-mono h-full flex items-center justify-center w-full">
        {formatDateTime(rowData.occurredAt)}
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
            className="px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white text-sm font-black rounded-sm border border-teal-500 hover:from-teal-500 hover:to-teal-600 transition-all shadow-md active:scale-95"
          >
            확인
          </button>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-cp-muted font-bold">확인완료</span>
            <span className="text-xs text-teal-500 font-black">{rowData.resolvedBy?.name || '시스템'}</span>
          </div>
        )}
      </div>
    );
  };

  const rowClassName = ({ index }) => {
    if (index < 0 || index >= notifications.length) return '';
    const notification = notifications[index];
    const isUnread = notification?.status === 'ACTIVE';
    return `hover:bg-cp-bg/30 border-b border-cp-border/50 transition-colors cursor-pointer ${isUnread ? 'bg-teal-500/5' : 'bg-cp-card/30'}`;
  };

  const headerRenderer = ({ label }) => {
    return (
      <div className="flex items-center justify-center w-full h-full text-sm font-semibold text-white dark:text-cp-text uppercase tracking-wider">
        {label}
      </div>
    );
  };

  // 동적 row height 계산 (내용에 따라)
  const getRowHeight = ({ index }) => {
    return 60; // 다른 테이블 행 높이(min-h-[60px])와 일치
  };

  if (notifications.length === 0) {
    return (
      <div className="bg-cp-card rounded-sm border border-cp-border overflow-hidden shadow-lg">
        <div className="px-4 py-20 text-center text-cp-muted bg-cp-card/30">
          알림이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cp-card rounded-sm border border-cp-border overflow-hidden shadow-lg flex-1 flex flex-col">
      <style>
        {`
          .ReactVirtualized__Table__headerRow {
            background-color: var(--bg-header) !important;
            border-bottom: 2px solid rgba(20, 184, 166, 0.3) !important;
            display: flex !important;
            align-items: center !important;
            text-transform: uppercase !important;
            border-top: none !important;
            border-left: none !important;
            border-right: none !important;
          }
          .ReactVirtualized__Table__headerColumn {
            background-color: transparent !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            outline: none !important;
          }
          .ReactVirtualized__Table__headerColumn:focus {
            outline: none !important;
          }
        `}
      </style>
      <div className="flex-1" style={{ minHeight: '600px', width: '100%' }}>
        <AutoSizer>
          {({ height, width }) => (
            <Table
              width={width}
              height={height}
              headerHeight={48}
              headerStyle={{ 
                backgroundColor: 'var(--bg-header)', 
                borderBottom: '2px solid rgba(20, 184, 166, 0.3)',
                display: 'flex',
                alignItems: 'center',
                margin: 0,
                padding: 0
              }}
              rowHeight={getRowHeight}
              rowCount={notifications.length}
              rowGetter={getRow}
              rowClassName={rowClassName}
              onRowClick={({ rowData }) => handleRowClick(rowData)}
              overscanRowCount={10}
              gridStyle={{ outline: 'none' }}
              className="modal-scrollbar"
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
                label="작업"
                dataKey="action"
                width={120}
                cellRenderer={actionCellRenderer}
                headerRenderer={headerRenderer}
              />
            </Table>
          )}
        </AutoSizer>
      </div>

      {/* 상세 보기 모달 */}
      {selectedNotification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg border border-cp-border rounded-sm shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-cp-border flex justify-between items-center bg-cp-bg/50">
              <h3 className="text-lg font-bold text-cp-text">알림 상세 내역</h3>
              <button 
                onClick={closeModal} 
                className="text-cp-muted hover:text-cp-text transition-colors text-2xl p-1"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded text-xs font-bold border ${getSeverityBadge(selectedNotification.severity).color}`}>
                  {getSeverityBadge(selectedNotification.severity).label}
                </span>
                <span className="px-2.5 py-1 bg-cp-bg text-cp-text rounded text-xs font-bold">
                  {getTypeLabel(selectedNotification.type)}
                </span>
                <span className="text-xs text-cp-muted ml-auto">
                  {formatDateTime(selectedNotification.occurredAt)}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-teal-600 uppercase tracking-wider block mb-1.5">알림 제목</label>
                <p className="text-lg font-bold text-cp-text leading-tight">{selectedNotification.title}</p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-teal-600 uppercase tracking-wider block mb-1.5">상세 내용</label>
                <div className="bg-cp-bg/50 p-4 rounded-none border border-cp-border text-sm text-cp-text whitespace-pre-wrap leading-relaxed min-h-[120px]">
                  {selectedNotification.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-cp-muted uppercase tracking-wider block mb-1">케어대상자</label>
                  <p className="text-sm font-bold text-cp-text">{selectedNotification.careTarget?.name || '-'}</p>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-cp-muted uppercase tracking-wider block mb-1">상태</label>
                  <p className="text-sm font-bold text-cp-text">{getStatusLabel(selectedNotification.status)}</p>
                </div>
              </div>

              {selectedNotification.status === 'RESOLVED' && (
                <div className="mt-6 p-4 bg-green-50 rounded-none border border-green-100">
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

            <div className="px-6 py-4 bg-cp-bg/50 border-t border-cp-border flex justify-end gap-3">
              {selectedNotification.status === 'ACTIVE' && (
                <button
                  onClick={(e) => {
                    handleConfirm(e, selectedNotification.notificationId);
                    closeModal();
                  }}
                  className="px-5 py-2.5 bg-teal-500 text-white rounded-none hover:bg-teal-600 font-bold shadow-sm transition-all active:scale-95"
                >
                  확인 처리하기
                </button>
              )}
              <button 
                onClick={closeModal} 
                className="px-5 py-2.5 bg-cp-bg border border-cp-border rounded-none hover:bg-cp-card font-bold text-cp-text transition-all"
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
