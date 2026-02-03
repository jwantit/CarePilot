import { apiClient } from "../apiClient";
const host = `/ai`;

export const sendAiChatMessage = async (data) => {
    try {
      // data는 { message: string, fileId: Long | null } 형태
      console.log("sendAiChatMessage 호출 - 전송 데이터:", data);
      const response = await apiClient.post(`${host}/chat`, data); 
      console.log("sendAiChatMessage 응답:", response.data);
      return response.data; 
    } catch (error) {
      console.error("AI 챗봇 메시지 전송 실패:", error);
      throw error;
    }
};

export const sendAiChatImage = async (file) => {
  try {
    const formData = new FormData();
    // 백엔드 @RequestPart("file") 이름에 맞춰 'file'로 설정
    formData.append("file", file);

    const response = await apiClient.post(`${host}/file`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    // 백엔드에서 return fileSave.getFileId() 한 Long 값이 옵니다.
    return response.data; 
  } catch (error) {
    console.error("임시 파일 업로드 실패:", error);
    throw error;
  }
};

export const deleteAiChatImage = async (fileId) => {
  try {
    const response = await apiClient.delete(`${host}/file/del`, {
      params: { fileId: fileId }
    });
    return response.data;
  } catch (error) {
    console.error("임시 파일 삭제 실패:", error);
    throw error;
  }
};

// 전체 채팅 로그 조회
export const getChatLogAll = async (userId) => {
  try {
    const response = await apiClient.get(`${host}/chat/log`, {
      params: { userId: userId }
    });
    return response.data; // List<ChatLogResponseDTO>
  } catch (error) {
    console.error("채팅 로그 조회 실패:", error);
    throw error;
  }
};