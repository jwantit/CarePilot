import React from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, X, Send, ChevronDown } from 'lucide-react';
import { API_SERVER_HOST } from '../../api/apiClient';

/**
 * SMS 위젯이 열렸을 때 보이는 패널 UI.
 * - 헤더: 제목, 케어대상자 검색 드롭다운, 새로고침/닫기
 * - 테두리·꼭짓점 드래그로 크기 조절
 * - 메시지 목록(채팅형) + 발신 입력
 * 모든 상태·로직은 useSmsWidget 훅에서 주입받음.
 */
const SmsWidgetPanel = ({
  size,
  handleResizeStart,
  scrollRef,
  dropdownRef,
  list,
  loading,
  displayList,
  loadList,
  formatDate,
  message,
  setMessage,
  sending,
  to,
  handleSend,
  closePanel,
  organizationId,
  displayValue,
  handleCareTargetInputChange,
  showCareTargetDropdown,
  setShowCareTargetDropdown,
  loadingCareTargets,
  filteredCareTargets,
  handleCareTargetSelect,
  fetchCareTargets,
  selectedCareTargetDisplay,
}) => {
  const edges = [
    { key: 'top', className: 'absolute left-0 top-0 right-0 h-2 cursor-n-resize z-10', edge: 'top' },
    { key: 'right', className: 'absolute right-0 top-0 bottom-0 w-2 cursor-e-resize z-10', edge: 'right' },
    { key: 'bottom', className: 'absolute left-0 right-0 bottom-0 h-2 cursor-n-resize z-10', edge: 'bottom' },
    { key: 'left', className: 'absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-10', edge: 'left' },
  ];
  const corners = [
    { key: 'top-left', className: 'absolute left-0 top-0 w-3 h-3 cursor-nwse-resize z-10', edge: 'top-left' },
    { key: 'top-right', className: 'absolute right-0 top-0 w-3 h-3 cursor-nesw-resize z-10', edge: 'top-right' },
    { key: 'bottom-left', className: 'absolute left-0 bottom-0 w-3 h-3 cursor-nesw-resize z-10', edge: 'bottom-left' },
    { key: 'bottom-right', className: 'absolute right-0 bottom-0 w-3 h-3 cursor-nwse-resize z-10', edge: 'bottom-right' },
  ];

  return (
    <div
      className="overflow-hidden bg-white rounded-3xl shadow-xl flex flex-col border border-gray-200 shrink-0"
      style={{ width: size.width, height: size.height }}
    >
      {edges.map(({ key, className, edge }) => (
        <div
          key={key}
          className={className}
          onMouseDown={(e) => handleResizeStart(e, edge)}
          aria-hidden
        />
      ))}
      {corners.map(({ key, className, edge }) => (
        <div
          key={key}
          className={className}
          onMouseDown={(e) => handleResizeStart(e, edge)}
          aria-hidden
        />
      ))}

      <div className="p-4 bg-teal-600 text-white rounded-t-3xl space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold shrink-0">문자 (SMS)</h3>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={loadList}
              disabled={loading}
              className="p-1.5 hover:bg-teal-700 rounded text-white/90 hover:text-white text-sm"
              title="새로고침"
            >
              새로고침
            </button>
            <button
              onClick={closePanel}
              className="p-1 hover:bg-teal-700 rounded-full"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div ref={dropdownRef} className="relative">
          <input
            type="text"
            value={displayValue}
            onChange={(e) => handleCareTargetInputChange(e.target.value)}
            onFocus={() => {
              if (!filteredCareTargets.length && !loadingCareTargets) fetchCareTargets(displayValue);
              setShowCareTargetDropdown(true);
            }}
            placeholder="케어대상자 검색 후 선택..."
            className="w-full px-3 py-2 rounded-lg bg-white/95 text-gray-800 placeholder-gray-500 border-0 focus:ring-2 focus:ring-white/50 text-sm"
            autoComplete="off"
          />
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          {showCareTargetDropdown && (
            <ul className="absolute z-20 left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200 text-gray-800">
              {loadingCareTargets ? (
                <li className="px-3 py-2 text-sm text-gray-500">검색 중...</li>
              ) : !organizationId ? (
                <li className="px-3 py-2 text-sm text-gray-500">로그인 후 이용 가능합니다.</li>
              ) : filteredCareTargets.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-500">검색 결과가 없습니다.</li>
              ) : (
                filteredCareTargets.map((item) => (
                  <li
                    key={item.careTargetId}
                    role="button"
                    onClick={() => handleCareTargetSelect(item)}
                    className="px-3 py-2 text-sm hover:bg-teal-50 cursor-pointer border-b border-gray-100 last:border-0"
                  >
                    {item.name ?? `ID ${item.careTargetId}`}
                    {item.careTargetPhone && (
                      <span className="text-gray-500 ml-1">({item.careTargetPhone})</span>
                    )}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 p-4 overflow-y-auto space-y-3 bg-gray-50"
      >
        {loading && list.length === 0 ? (
          <div className="text-center text-gray-400 py-10">로딩 중...</div>
        ) : displayList.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            <Smartphone className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">
              {selectedCareTargetDisplay
                ? '이 케어대상자와 주고받은 문자가 없습니다.'
                : '수신·발신 문자가 없습니다.'}
            </p>
          </div>
        ) : (
          [...displayList].reverse().map((msg) => {
            const isOutbound = msg.direction === 'OUTBOUND';
            const senderLabel = msg.senderType === 'USER' ? '나' : msg.senderType === 'AI' ? 'AI' : null;
            const displayName = msg.careTargetName ? `${msg.careTargetName}님` : null;
            const detailUrl = msg.careTargetId ? `/care-target/detail/${msg.careTargetId}` : null;
            return (
              <div
                key={msg.id}
                className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
                    isOutbound
                      ? 'bg-teal-500 text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className={`text-xs mb-1 ${isOutbound ? 'text-teal-100' : 'text-teal-600'}`}>
                    {isOutbound ? (
                      senderLabel
                    ) : detailUrl && displayName ? (
                      <Link
                        to={detailUrl}
                        className="font-medium hover:opacity-80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {displayName}
                      </Link>
                    ) : (
                      msg.fromNumber
                    )}
                    {msg.createdAt && (
                      <span className={isOutbound ? 'text-white/80 ml-2' : 'text-gray-400 ml-2'}>
                        {formatDate(msg.createdAt)}
                      </span>
                    )}
                  </div>
                  {msg.body && (
                    <div className="whitespace-pre-wrap">{msg.body}</div>
                  )}
                  {msg.mediaUrls && msg.mediaUrls.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {msg.mediaUrls.slice(0, 3).map((url, idx) => {
                        const fullUrl = `${API_SERVER_HOST}${url}`;
                        const isImage =
                          /\.(jpg|jpeg|png|gif|webp)$/i.test(url) ||
                          url.includes('image');
                        return (
                          <div key={idx} className="rounded overflow-hidden">
                            {isImage ? (
                              <a
                                href={fullUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <img
                                  src={fullUrl}
                                  alt={`첨부 ${idx + 1}`}
                                  className="max-h-20 object-contain"
                                />
                              </a>
                            ) : (
                              <a
                                href={fullUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-teal-600 hover:underline"
                              >
                                미디어
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 border-t bg-white rounded-b-3xl flex gap-2">
        <input
          type="text"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          placeholder="메시지를 입력하세요..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          disabled={sending}
        />
        <button
          onClick={handleSend}
          disabled={sending || !to.trim() || !message.trim()}
          className={`p-2 rounded-full text-white transition-colors shrink-0 ${
            message.trim()
              ? 'bg-teal-600 hover:bg-teal-700'
              : 'bg-gray-300 cursor-not-allowed'
          } ${!to.trim() || sending ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          aria-label="전송"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default SmsWidgetPanel;
