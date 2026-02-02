import { apiClient } from "../apiClient";
const host = `/ai`;

export const sendAiChatMessage = async (data) => {
    try {
      // data는 { message: "...", props: {...} } 형태여야 함
      const response = await apiClient.post(`${host}/chat`, data); 
      return response.data; 
    } catch (error) {
      console.error("AI 챗봇 메시지 전송 실패:", error);
      throw error;
    }
};