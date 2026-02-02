import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { sendAiChatMessage } from '../../api/aiChat/aiChatBotApi'; // 경로 확인 필요
import { useAuth } from '../../hooks/useAuth';

const AiChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (input.trim() === '' || isLoading) return;
  
    const userMessage = input;
    
    const requestPayload = {
        message: userMessage,
        props: userInfo 
    };
  
    setMessages((prev) => [...prev, { id: Date.now(), text: userMessage, sender: 'user' }]);
    setInput('');
    setIsLoading(true);
  
    try {
      const aiResponse = await sendAiChatMessage(requestPayload);
  
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: aiResponse, sender: 'ai' },
      ]);
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

  if (!isOpen) {
    return (
      <button
        className="fixed bottom-8 right-8 w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-teal-700 transition-all z-[1000]"
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare className="h-8 w-8 text-white" />
      </button>
    );
  }

  return (
    /* 가로폭 w-80 -> w-[450px], 높이 h-[500px] -> h-[600px] 수정 */
    <div className="fixed bottom-8 right-8 w-[450px] h-[600px] bg-white rounded-3xl shadow-xl flex flex-col z-[1000] border border-gray-200">
      {/* 헤더 */}
      <div className="flex justify-between items-center p-4 bg-teal-600 text-white rounded-t-3xl">
        <h3 className="text-lg font-bold">CarePilot AI 비서</h3>
        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-teal-700 rounded-full">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* 메시지 영역 */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-gray-400 mt-10">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
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
              {/* 줄바꿈 보존을 위해 white-space 추가 */}
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
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
      <div className="p-4 border-t bg-white rounded-b-3xl flex items-center">
        <input
          type="text"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          placeholder="메시지를 입력하세요..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          disabled={isLoading}
        />
        <button 
          onClick={handleSendMessage} 
          disabled={isLoading}
          className={`ml-2 p-2 rounded-full text-white transition-colors ${isLoading ? 'bg-gray-300' : 'bg-teal-600 hover:bg-teal-700'}`}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default AiChatBot;