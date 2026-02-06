import React from 'react';
import { Bot, X, Send, Paperclip } from 'lucide-react';

/**
 * AI 채팅 위젯이 열렸을 때 보이는 패널 UI.
 * - 헤더: 제목, 날짜, 닫기
 * - 메시지 목록(채팅형) + 발신 입력
 * 모든 상태·로직은 AiChatBot에서 주입받음.
 */
const AiChatPanel = ({
  scrollRef,
  fileInputRef,
  messages,
  isLoading,
  input,
  setInput,
  selectedImage,
  textareaRef,
  adjustTextareaHeight,
  handleKeyDown,
  handlePickImage,
  handleImageChange,
  handleRemoveSelectedImage,
  handleSendMessage,
  closePanel,
  size,
  handleResizeStart,
  providerKey,
  setProviderKey,
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
      className="fixed bottom-8 right-8 bg-cp-card bg-gradient-to-br from-cp-card to-cp-bg shadow-xl flex flex-col z-[1000] border border-cp-border shrink-0"
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
      {/* 헤더 */}
      <div className="flex justify-between items-center p-4 bg-cp-bg/30 border-b border-cp-border">
        <div className="flex flex-col">
          <h3 className="text-lg font-bold text-teal-400">CarePilot AI Kite</h3>
          <span className="text-xs text-cp-muted mt-0.5">
            {new Date().toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'short'
            })}
          </span>
        </div>
        {/* 클라우드 / 온디바이스 토글 */}
        <div className="flex items-center bg-slate-800 rounded-full p-1 border border-slate-600 mx-4">
          <button
            onClick={() => setProviderKey(0)}
            className={`px-3 py-1 text-[10px] font-medium rounded-full transition-all ${
              providerKey === 0 
                ? 'bg-teal-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            클라우드
          </button>
          <button
            onClick={() => setProviderKey(1)}
            className={`px-3 py-1 text-[10px] font-medium rounded-full transition-all ${
              providerKey === 1 
                ? 'bg-teal-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            온디바이스
          </button>
        </div>

        <button onClick={closePanel} className="p-1 hover:bg-slate-600 text-slate-300 hover:text-slate-100 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* 메시지 영역 */}
      <div ref={scrollRef} className="flex-1 min-h-0 p-4 overflow-y-auto space-y-3 bg-cp-input/20 modal-scrollbar relative">
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-cp-muted mt-10">
            <Bot className="h-12 w-12 mx-auto mb-2 opacity-20 text-cp-text" />
            <p className="text-sm">무엇을 도와드릴까요?</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm text-left ${
              msg.sender === 'user' 
                ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-br-none shadow-md' 
                : 'bg-cp-card text-cp-text border border-cp-border rounded-bl-none shadow-sm'
            }`}>
              {/* 파일과 텍스트를 함께 보낸 경우 이미지 미리보기 표시 */}
              {msg.imagePreview && (
                <div className="mb-2">
                  <img
                    src={msg.imagePreview.previewUrl}
                    alt={msg.imagePreview.fileName}
                    className="max-w-[200px] max-h-[200px] object-cover border border-cp-border"
                  />
                </div>
              )}
              {/* 줄바꿈 보존을 위해 white-space 추가 */}
              <div style={{ whiteSpace: 'pre-wrap' }} className="text-left">{msg.text}</div>
              {/* 사용자 메시지 아래에 날짜 표시 */}
              {msg.sender === 'user' && msg.createdAt && (
                <div className="text-[10px] text-white/70 mt-1 text-right">
                  {msg.createdAt}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 로딩 표시 */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-cp-card border border-cp-border text-cp-muted px-4 py-2 rounded-2xl rounded-bl-none text-xs animate-pulse">
              비서가 생각 중입니다...
            </div>
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="p-4 border-t border-cp-border bg-cp-bg/30">
        {/* 둥둥 떠있는 이미지 미리보기 */}
        {selectedImage && (
          <div className="mb-3 relative inline-flex items-center gap-3 p-2 pr-10 bg-cp-card border border-cp-border shadow-sm">
            <img
              src={selectedImage.previewUrl}
              alt="선택한 이미지 미리보기"
              className="w-16 h-16 object-cover border border-cp-border bg-cp-bg"
            />
            <div className="min-w-0">
              <div className="text-xs text-cp-text font-medium truncate max-w-[260px]">
                {selectedImage.fileName}
              </div>
              <div className="text-[11px] text-cp-muted mt-0.5">
                {selectedImage.isUploading && "업로드 중..."}
                {!selectedImage.isUploading && selectedImage.fileId && `업로드 완료 (fileId: ${selectedImage.fileId})`}
                {!selectedImage.isUploading && !selectedImage.fileId && "업로드 완료 (fileId 미수신)"}
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemoveSelectedImage}
              className="absolute top-2 right-2 p-1 hover:bg-cp-bg text-cp-muted hover:text-cp-text transition-colors"
              aria-label="선택 이미지 제거"
              title="선택 이미지 제거"
              disabled={isLoading || selectedImage.isUploading || selectedImage.isDeleting}
            >
              <X className="h-4 w-4" />
            </button>

            {/* 사용자 입력 폼에 숨겨서 fileId 넣기 */}
            <input type="hidden" name="aiChatFileId" value={selectedImage.fileId || ""} />
          </div>
        )}

        <div className="flex items-center">
          {/* 이미지 1장 선택 (선택 즉시 업로드) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={false}
            className="hidden"
            onChange={handleImageChange}
          />
          <button
            type="button"
            onClick={handlePickImage}
            disabled={isLoading}
            className={`mr-2 p-2 transition-colors rounded-sm ${isLoading ? 'bg-cp-bg/50 text-cp-muted' : 'bg-cp-input text-cp-text hover:bg-cp-bg border border-cp-border'}`}
            aria-label="사진 선택"
            title="사진 선택"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <textarea
            ref={textareaRef}
            className="flex-1 px-3 py-2 border border-cp-border bg-cp-input text-cp-text placeholder:text-cp-muted focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-sm rounded-sm resize-none overflow-hidden min-h-[40px] max-h-[120px]"
            placeholder="Kite에게 요청하세요 (Shift+Enter: 줄바꿈)"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
          />
          <button 
            onClick={handleSendMessage} 
            disabled={isLoading || selectedImage?.isUploading}
            className={`ml-2 p-2 text-white transition-colors rounded-sm ${isLoading || selectedImage?.isUploading ? 'bg-cp-bg/50 text-cp-muted' : 'bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600'}`}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiChatPanel;
