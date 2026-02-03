import React, { useState, useEffect, useRef } from 'react';
import { Bot,MessageSquare, X, Send, Paperclip } from 'lucide-react';
import { sendAiChatMessage, sendAiChatImage, deleteAiChatImage, getChatLogAll } from '../../api/aiChat/aiChatBotApi';
import { useAuth } from '../../hooks/useAuth';

const AiChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // { fileName, previewUrl, fileId, isUploading, isDeleting }

  const { user } = useAuth();
  const organizationId = user?.organizationId;
  const role = user?.role; // ADMIN, MANAGER, USER 값 확인
  const userId = user?.userId;
  const userName = user?.name;
  const userOrganization = user?.organization;
  const userOrganizationNumber = user?.organizationNumber;
  const userRole = user?.role;

  const [userInfo, setUserInfo] = useState({
    organizationId: organizationId,
    role: role,
    userId: userId,
    userName: userName,
    userOrganization: userOrganization,
    userOrganizationNumber: userOrganizationNumber,
    userRole: userRole,
  });

  // 채팅창 하단 자동 스크롤을 위한 Ref
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // 컴포넌트가 열릴 때 전체 채팅 로그 조회
  useEffect(() => {
    if (isOpen && userId) {
      const loadChatLogs = async () => {
        try {
          const chatLogs = await getChatLogAll(userId);
          // ChatLogResponseDTO[] -> messages 형식으로 변환
          // [{ chatId, question, answer, createdAt }, ...]
          const loadedMessages = chatLogs.flatMap((log) => [
            { id: `user-${log.chatId}`, text: log.question, sender: 'user', createdAt: log.createdAt },
            { id: `ai-${log.chatId}`, text: log.answer, sender: 'ai' },
          ]);
          setMessages(loadedMessages);
        } catch (error) {
          console.error("채팅 로그 조회 실패:", error);
          // 에러가 나도 기존 빈 배열로 시작
        }
      };
      loadChatLogs();
    } else if (!isOpen) {
      // 채팅창이 닫히면 메시지 초기화 (선택사항: 유지하려면 이 부분 제거)
      // setMessages([]);
    }
  }, [isOpen, userId]);

  // 선택된 이미지/미리보기 정리
  const clearSelectedImage = () => {
    setSelectedImage((prev) => {
      if (prev?.previewUrl) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      return null;
    });
  };

  const handleSendMessage = async () => {
    if (input.trim() === '' || isLoading) return;
  
    // 이미지가 선택되어 있지만 업로드 중이면 전송 불가
    if (selectedImage?.isUploading) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text: "이미지 업로드가 완료될 때까지 기다려주세요.", sender: 'ai' },
      ]);
      return;
    }
  
    // 이미지가 선택되어 있지만 fileId가 없으면 업로드 실패 또는 미완료
    if (selectedImage && !selectedImage.fileId) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text: "이미지 업로드에 실패했습니다. 이미지를 다시 선택해주세요.", sender: 'ai' },
      ]);
      return;
    }
  
    const userMessage = input;
    
    // 백엔드 스펙: { message: string, fileId: Long | null }
    // fileId가 있으면 숫자로 변환 (백엔드 Long 타입에 맞춤)
    const fileId = selectedImage?.fileId 
      ? (typeof selectedImage.fileId === 'string' ? Number(selectedImage.fileId) : selectedImage.fileId)
      : null;
    
    const requestPayload = {
      message: userMessage,
      fileId: fileId, // 파일이 선택된 상태면 id, 아니면 null
    };
  
    // 디버깅: 전송되는 데이터 확인
    console.log("=== 전송 데이터 확인 ===");
    console.log("selectedImage:", selectedImage);
    console.log("추출된 fileId:", fileId);
    console.log("requestPayload:", requestPayload);
    console.log("requestPayload JSON:", JSON.stringify(requestPayload));
  
    // 전송 버튼 클릭 시 이미지 즉시 제거 (fileId는 이미 requestPayload에 포함됨)
    if (selectedImage) {
      clearSelectedImage();
    }
  
    // 사용자 메시지를 먼저 추가 (임시 ID, 나중에 응답에서 받은 chatId로 업데이트 가능)
    const tempUserMessageId = `user-temp-${Date.now()}`;
    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}시 ${String(now.getMinutes()).padStart(2, '0')}분`;
    setMessages((prev) => [...prev, { id: tempUserMessageId, text: userMessage, sender: 'user', createdAt: timeString }]);
    setInput('');
    setIsLoading(true);
  
    try {
      const response = await sendAiChatMessage(requestPayload);
      // 백엔드 ChatLogResponseDTO: { chatId, question, answer, createdAt }
      // apiClient.post는 response.data를 반환하므로 response가 이미 DTO 객체
      console.log("AI 응답 받음:", response); // 디버깅용
      
      const aiAnswer = response?.answer || (typeof response === 'string' ? response : "응답을 받지 못했습니다.");
      
      if (!aiAnswer || aiAnswer.trim() === '') {
        console.error("AI 응답이 비어있음:", response);
      }
  
      // 임시 메시지의 id를 실제 chatId로 업데이트
      setMessages((prev) => {
        const updated = prev.map(msg => 
          msg.id === tempUserMessageId 
            ? { ...msg, id: `user-${response?.chatId || Date.now()}` }
            : msg
        );
        return [...updated, { id: `ai-${response?.chatId || Date.now()}`, text: aiAnswer, sender: 'ai' }];
      });
    } catch (error) {
      console.error("채팅 에러:", error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: "오류가 발생했습니다. 다시 시도해주세요.", sender: 'ai' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // textarea 자동 높이 조절
  const textareaRef = useRef(null);
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  // Enter는 줄바꿈, Shift+Enter는 발송
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePickImage = () => {
    if (isLoading) return;
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    // 같은 파일을 다시 선택해도 change 이벤트가 발생하도록 초기화
    e.target.value = '';

    if (!file || isLoading) return;
    if (!file.type?.startsWith('image/')) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text: "이미지 파일만 선택할 수 있습니다.", sender: 'ai' },
      ]);
      return;
    }

    // 기존 미리보기 있으면 정리
    clearSelectedImage();

    // 1) 즉시 미리보기 표시 (둥둥 떠있는 상태)
    const previewUrl = URL.createObjectURL(file);
    setSelectedImage({
      fileName: file.name,
      previewUrl,
      fileId: null,
      isUploading: true,
      isDeleting: false,
    });

    // 2) 선택 즉시 업로드 -> fileId 수신
    setIsLoading(true);

    try {
      const fileId = await sendAiChatImage(file);
      
      // 디버깅: 받은 fileId 확인
      console.log("이미지 업로드 완료, 받은 fileId:", fileId);

      setSelectedImage((prev) => ({
        ...(prev || {}),
        fileId,
        isUploading: false,
      }));
    } catch (error) {
      console.error("이미지 전송 에러:", error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: "이미지 업로드 중 오류가 발생했습니다. 다시 시도해주세요.", sender: 'ai' },
      ]);
      setSelectedImage((prev) => ({
        ...(prev || {}),
        isUploading: false,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSelectedImage = async () => {
    if (!selectedImage) return;
    if (isLoading || selectedImage.isUploading) return;

    const fileId = selectedImage.fileId;

    // 서버에 저장된 이미지라면 삭제 API 호출
    if (fileId) {
      setSelectedImage((prev) => ({
        ...(prev || {}),
        isDeleting: true,
      }));
      setIsLoading(true);
      try {
        await deleteAiChatImage(fileId);
      } catch (error) {
        console.error("이미지 삭제 에러:", error);
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, text: "이미지 삭제 중 오류가 발생했습니다. 다시 시도해주세요.", sender: 'ai' },
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    // 삭제 성공/실패 상관없이, 다음 채팅에 fileId가 같이 안 나가도록
    // 항상 선택 상태/미리보기/fileId는 비웁니다.
    clearSelectedImage();
  };

  if (!isOpen) {
    return (
      <button
        className="fixed bottom-8 right-8 w-16 h-16 bg-teal-600 flex items-center justify-center shadow-lg cursor-pointer hover:bg-teal-700 transition-all z-[1000]"
        onClick={() => setIsOpen(true)}
      >
        <Bot className="h-8 w-8 text-white" />
      </button>
    );
  }

  return (
    /* 가로폭 w-80 -> w-[450px], 높이 h-[500px] -> h-[600px] 수정 */

    <div className="fixed bottom-8 right-8 w-[450px] h-[600px] bg-white shadow-xl flex flex-col z-[1000] border border-gray-200">
      {/* 헤더 */}
      <div className="flex justify-between items-center p-4 bg-teal-600 text-white">
        <div className="flex flex-col">
        <h3 className="text-lg font-bold">CarePilot AI 비서</h3>
          <span className="text-xs text-white/80 mt-0.5">
            {new Date().toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'short'
            })}
          </span>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-teal-700">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* 메시지 영역 */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-gray-400 mt-10">
            <Bot className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">무엇을 도와드릴까요?</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
              msg.sender === 'user' 
                ? 'bg-teal-500 text-white rounded-br-none' 
                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
            }`}>
              {/* 파일과 텍스트를 함께 보낸 경우 이미지 미리보기 표시 */}
              {msg.imagePreview && (
                <div className="mb-2">
                  <img
                    src={msg.imagePreview.previewUrl}
                    alt={msg.imagePreview.fileName}
                    className="max-w-[200px] max-h-[200px] object-cover rounded-lg border border-white/20"
                  />
                </div>
              )}
              {/* 줄바꿈 보존을 위해 white-space 추가 */}
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
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
            <div className="bg-white border border-gray-200 text-gray-400 px-4 py-2 rounded-2xl rounded-bl-none text-xs animate-pulse">
              비서가 생각 중입니다...
            </div>
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="p-4 border-t bg-white">
        {/* 둥둥 떠있는 이미지 미리보기 */}
        {selectedImage && (
          <div className="mb-3 relative inline-flex items-center gap-3 p-2 pr-10 bg-gray-50 border border-gray-200 shadow-sm">
            <img
              src={selectedImage.previewUrl}
              alt="선택한 이미지 미리보기"
              className="w-16 h-16 object-cover border border-gray-200 bg-white"
            />
            <div className="min-w-0">
              <div className="text-xs text-gray-700 font-medium truncate max-w-[260px]">
                {selectedImage.fileName}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                {selectedImage.isUploading && "업로드 중..."}
                {!selectedImage.isUploading && selectedImage.fileId && `업로드 완료 (fileId: ${selectedImage.fileId})`}
                {!selectedImage.isUploading && !selectedImage.fileId && "업로드 완료 (fileId 미수신)"}
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemoveSelectedImage}
              className="absolute top-2 right-2 p-1 hover:bg-gray-200 text-gray-600"
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
          disabled={isLoading}
        />
          <button
            type="button"
            onClick={handlePickImage}
            disabled={isLoading}
            className={`mr-2 p-2 transition-colors ${isLoading ? 'bg-gray-100 text-gray-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            aria-label="사진 선택"
            title="사진 선택"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <textarea
            ref={textareaRef}
            className="flex-1 px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none overflow-hidden min-h-[40px] max-h-[120px]"
            placeholder="에이전트 (Enter: 전송, Shift+Enter: 줄바꿈)"
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
            className={`ml-2 p-2 text-white transition-colors ${isLoading || selectedImage?.isUploading ? 'bg-gray-300' : 'bg-teal-600 hover:bg-teal-700'}`}
        >
          <Send className="h-5 w-5" />
        </button>
        </div>
      </div>
    </div>
  );
};

export default AiChatBot;