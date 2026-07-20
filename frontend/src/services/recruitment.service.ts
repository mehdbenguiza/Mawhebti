import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.182.128:8000/api/v1';

export const recruitmentService = {
  createContactRequest: async (talentId: string, message: string) => {
    // In a real app we pass auth tokens
    const response = await axios.post(`${API_URL}/recruitment/requests?subject_talent_id=${talentId}&message=${encodeURIComponent(message)}`);
    return response.data;
  },

  acceptContactRequest: async (requestId: string) => {
    const response = await axios.post(`${API_URL}/recruitment/requests/${requestId}/accept`);
    return response.data;
  },

  getConversations: async () => {
    const response = await axios.get(`${API_URL}/conversations/`);
    return response.data;
  },

  getMessages: async (conversationId: string) => {
    const response = await axios.get(`${API_URL}/conversations/${conversationId}/messages`);
    return response.data;
  },

  sendMessage: async (conversationId: string, content: string, senderId: string) => {
    const response = await axios.post(`${API_URL}/conversations/${conversationId}/messages?content=${encodeURIComponent(content)}&sender_id=${senderId}`);
    return response.data;
  }
};
