import axios from 'axios';

const API_URL = '/api/v1/visitor';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  _id: string;
  sessionId: string;
  startTime: string;
  endTime?: string;
  isActive: boolean;
  messages: Message[];
}

export interface InitSessionResponse {
  success: boolean;
  data: {
    sessionId: string;
    userId: string;
    chatbotId: string;
  };
}

export const visitorService = {
  initializeSession: async (email: string, chatbotId: string): Promise<InitSessionResponse> => {
    const response = await axios.post(`${API_URL}/session`, {
      email,
      chatbotId: chatbotId.replace('$', '')  // Remove the $ prefix if present
    });
    return response.data;
  },

  getChatHistory: async (email: string): Promise<ChatSession[]> => {
    const response = await axios.get(`${API_URL}/history`, {
      params: { email }
    });
    return response.data.data.map((session: any) => ({
      _id: session._id,
      sessionId: session.sessionId,
      startTime: session.startTime,
      endTime: session.endTime,
      isActive: session.isActive,
      messages: session.messages
    }));
  },

  sendMessage: async (sessionId: string, role: 'user' | 'assistant', content: string): Promise<any> => {
    const response = await axios.post(`${API_URL}/message`, {
      sessionId,
      role,
      content
    });
    return response.data;
  },

  endSession: async (sessionId: string): Promise<any> => {
    const response = await axios.put(`${API_URL}/session/${sessionId}/end`);
    return response.data;
  }
};

export default visitorService;
