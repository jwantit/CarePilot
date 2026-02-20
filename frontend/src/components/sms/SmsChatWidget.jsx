import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Smartphone } from 'lucide-react';
import { useSmsWidget } from '../../hooks/useSmsWidget';
import SmsWidgetPanel from './SmsWidgetPanel';

/**
 * SMS 위젯 진입점.
 * - 오른쪽 하단 고정 플로팅 버튼 + 열리면 SmsWidgetPanel (Portal로 body에 렌더)
 * - 모든 상태·로직은 useSmsWidget 훅에서 가져옴.
 */
const SmsChatWidget = () => {
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);

  // AiChatBot 열림/닫힘 상태 구독
  useEffect(() => {
    const handleAiChatOpen = (event) => {
      setIsAiChatOpen(event.detail.isOpen);
    };

    window.addEventListener('ai-chat-open', handleAiChatOpen);
    return () => {
      window.removeEventListener('ai-chat-open', handleAiChatOpen);
    };
  }, []);

  const {
    isOpen,
    openPanel,
    closePanel,
    smsUnreadCount,
    size,
    handleResizeStart,
    scrollRef,
    dropdownRef,
    list,
    loading,
    displayList,
    loadList,
    formatDate,
    to,
    message,
    setMessage,
    sending,
    handleSend,
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
  } = useSmsWidget();

  // SMS 위젯이 열릴 때 AiChatBot 닫기
  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent('ai-chat-close'));
    }
  }, [isOpen]);

  // AiChatBot가 열릴 때 SMS 위젯 닫기
  useEffect(() => {
    const handleSmsWidgetClose = () => {
      if (isOpen) {
        closePanel();
      }
    };

    window.addEventListener('sms-widget-close', handleSmsWidgetClose);
    return () => {
      window.removeEventListener('sms-widget-close', handleSmsWidgetClose);
    };
  }, [isOpen, closePanel]);

  const anchorStyle = {
    position: 'fixed',
    right: 32,
    bottom: 112,
    left: 'auto',
    zIndex: 1000,
    direction: 'ltr',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  };

  // AiChatBot가 열려있으면 SMS 아이콘 숨기기
  if (isAiChatOpen && !isOpen) {
    return null;
  }

  const widgetContent = !isOpen ? (
    <button
      className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-teal-700 transition-all relative shrink-0"
      onClick={openPanel}
      aria-label="문자 열기"
    >
      <Smartphone className="h-8 w-8 text-white" />
      {smsUnreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
          {smsUnreadCount > 99 ? '99+' : smsUnreadCount}
        </span>
      )}
    </button>
  ) : (
    <SmsWidgetPanel
      size={size}
      handleResizeStart={handleResizeStart}
      scrollRef={scrollRef}
      dropdownRef={dropdownRef}
      list={list}
      loading={loading}
      displayList={displayList}
      loadList={loadList}
      formatDate={formatDate}
      to={to}
      message={message}
      setMessage={setMessage}
      sending={sending}
      handleSend={handleSend}
      closePanel={closePanel}
      organizationId={organizationId}
      displayValue={displayValue}
      handleCareTargetInputChange={handleCareTargetInputChange}
      showCareTargetDropdown={showCareTargetDropdown}
      setShowCareTargetDropdown={setShowCareTargetDropdown}
      loadingCareTargets={loadingCareTargets}
      filteredCareTargets={filteredCareTargets}
      handleCareTargetSelect={handleCareTargetSelect}
      fetchCareTargets={fetchCareTargets}
      selectedCareTargetDisplay={selectedCareTargetDisplay}
    />
  );

  return createPortal(
    <div style={anchorStyle}>{widgetContent}</div>,
    document.body
  );
};

export default SmsChatWidget;
