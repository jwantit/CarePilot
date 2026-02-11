import React, { useState, useEffect, useRef } from 'react';
import { Bot } from 'lucide-react';
import { sendAiChatMessage, sendAiChatImage, deleteAiChatImage, getChatLogAll } from '../../api/aiChat/aiChatBotApi';
import { useAuth } from '../../hooks/useAuth';
import AiChatPanel from './AiChatPanel';

const AiChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // { fileName, previewUrl, fileId, isUploading, isDeleting }
  const [providerKey, setProviderKey] = useState(0); // 0: Cloud, 1: On-device

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
  const textareaRef = useRef(null);

  // 리사이징 관련 상태 및 로직
  const [size, setSize] = useState({ width: 450, height: 600 });
  const resizeRef = useRef({ edge: null, startX: 0, startY: 0, startW: 0, startH: 0 });

  const MIN_W = 320;
  const MIN_H = 400;

  const getMaxSize = () => ({
    w: typeof window !== 'undefined' ? Math.floor(window.innerWidth * 0.9) : 900,
    h: typeof window !== 'undefined' ? Math.floor(window.innerHeight * 0.85) : 800,
  });

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const handleResizeStart = (e, edge) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = {
      edge,
      startX: e.clientX,
      startY: e.clientY,
      startW: size.width,
      startH: size.height,
    };

    const cursors = {
      top: 'n-resize',
      right: 'e-resize',
      bottom: 's-resize',
      left: 'w-resize',
      'top-left': 'nwse-resize',
      'top-right': 'nesw-resize',
      'bottom-left': 'nesw-resize',
      'bottom-right': 'nwse-resize',
    };
    document.body.style.cursor = cursors[edge] || '';
    document.body.style.userSelect = 'none';

    const onMove = (e2) => {
      const { edge: ed, startX: sx, startY: sy, startW: sw, startH: sh } = resizeRef.current;
      if (!ed) return;
      const { w: maxW, h: maxH } = getMaxSize();
      setSize((prev) => {
        let w = prev.width;
        let h = prev.height;
        if (ed === 'right') w = clamp(sw + (e2.clientX - sx), MIN_W, maxW);
        else if (ed === 'left') w = clamp(sw + (sx - e2.clientX), MIN_W, maxW);
        else if (ed === 'bottom') h = clamp(sh + (e2.clientY - sy), MIN_H, maxH);
        else if (ed === 'top') h = clamp(sh + (sy - e2.clientY), MIN_H, maxH);
        else if (ed === 'top-left') {
          w = clamp(sw + (sx - e2.clientX), MIN_W, maxW);
          h = clamp(sh + (sy - e2.clientY), MIN_H, maxH);
        } else if (ed === 'top-right') {
          w = clamp(sw + (e2.clientX - sx), MIN_W, maxW);
          h = clamp(sh + (sy - e2.clientY), MIN_H, maxH);
        } else if (ed === 'bottom-left') {
          w = clamp(sw + (sx - e2.clientX), MIN_W, maxW);
          h = clamp(sh + (e2.clientY - sy), MIN_H, maxH);
        } else if (ed === 'bottom-right') {
          w = clamp(sw + (e2.clientX - sx), MIN_W, maxW);
          h = clamp(sh + (e2.clientY - sy), MIN_H, maxH);
        }
        return { width: w, height: h };
      });
    };
    const onUp = () => {
      resizeRef.current.edge = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // AiChatBot 열림/닫힘 상태를 다른 컴포넌트에 알리기
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('ai-chat-open', { detail: { isOpen } })
    );
    
    // AiChatBot가 열릴 때 SMS 위젯 닫기
    if (isOpen) {
      window.dispatchEvent(new CustomEvent('sms-widget-close'));
    }
  }, [isOpen]);

  // SMS 위젯이 열릴 때 AiChatBot 닫기
  useEffect(() => {
    const handleSmsWidgetOpen = () => {
      setIsOpen(false);
    };

    window.addEventListener('ai-chat-close', handleSmsWidgetOpen);
    return () => {
      window.removeEventListener('ai-chat-close', handleSmsWidgetOpen);
    };
  }, []);

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
    
    // 백엔드 스펙: { message: string, fileId: Long | null, providerKey: Long }
    // fileId가 있으면 숫자로 변환 (백엔드 Long 타입에 맞춤)
    const fileId = selectedImage?.fileId 
      ? (typeof selectedImage.fileId === 'string' ? Number(selectedImage.fileId) : selectedImage.fileId)
      : null;
    
    const requestPayload = {
      message: userMessage,
      fileId: fileId, // 파일이 선택된 상태면 id, 아니면 null
      providerKey: providerKey, // 0: Cloud, 1: On-device
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
    if (!file.type?.startsWith('image/') && !file.type?.startsWith('application/')) {
      setMessages((prev) => [
        ...prev,
        { 
          id: Date.now(), 
          text: "이미지 또는 문서 파일만 선택할 수 있습니다.", 
          sender: 'ai' 
        },
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
        className="fixed bottom-8 right-8 w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-teal-700 transition-all z-[1000]"
        onClick={() => setIsOpen(true)}
      >
        <Bot className="h-8 w-8 text-white" />
      </button>
    );
  }

  return (
    <AiChatPanel
      scrollRef={scrollRef}
      fileInputRef={fileInputRef}
      messages={messages}
      isLoading={isLoading}
      input={input}
      setInput={setInput}
      selectedImage={selectedImage}
      textareaRef={textareaRef}
      adjustTextareaHeight={adjustTextareaHeight}
      handleKeyDown={handleKeyDown}
      handlePickImage={handlePickImage}
      handleImageChange={handleImageChange}
      handleRemoveSelectedImage={handleRemoveSelectedImage}
      handleSendMessage={handleSendMessage}
      closePanel={() => setIsOpen(false)}
      size={size}
      handleResizeStart={handleResizeStart}
      providerKey={providerKey}
      setProviderKey={setProviderKey}
    />
  );
};

export default AiChatBot;