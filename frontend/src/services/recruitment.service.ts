import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.182.128:8000/api/v1';

const getCurrentUserId = () => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) throw new Error("Non connecté");
  return userId;
};

export const recruitmentService = {
  createContactRequest: async (talentId: string, message: string) => {
    const recruiterId = getCurrentUserId();
    const response = await axios.post(
      `${API_URL}/recruitment/requests?recruiter_id=${recruiterId}&subject_talent_id=${talentId}&message=${encodeURIComponent(message)}`
    );
    return response.data;
  },

  acceptContactRequest: async (requestId: string) => {
    const acceptorId = getCurrentUserId();
    const response = await axios.post(
      `${API_URL}/recruitment/requests/${requestId}/accept?acceptor_id=${acceptorId}`
    );
    return response.data;
  },

  rejectContactRequest: async (requestId: string) => {
    const rejectorId = getCurrentUserId();
    const response = await axios.post(
      `${API_URL}/recruitment/requests/${requestId}/reject?rejector_id=${rejectorId}`
    );
    return response.data;
  },

  getRequests: async () => {
    const userId = getCurrentUserId();
    const response = await axios.get(`${API_URL}/recruitment/requests?user_id=${userId}`);
    return response.data;
  },

  getConversations: async () => {
    const userId = getCurrentUserId();
    const response = await axios.get(`${API_URL}/conversations/?user_id=${userId}`);
    return response.data;
  },

  getMessages: async (conversationId: string) => {
    const userId = getCurrentUserId();
    const response = await axios.get(`${API_URL}/conversations/${conversationId}/messages?user_id=${userId}`);
    return response.data;
  },

  sendMessage: async (conversationId: string, content: string) => {
    const senderId = getCurrentUserId();
    const response = await axios.post(
      `${API_URL}/conversations/${conversationId}/messages?content=${encodeURIComponent(content)}&sender_id=${senderId}`
    );
    return response.data;
  },

  toggleSavedTalent: async (talentId: string) => {
    const recruiterId = getCurrentUserId();
    const response = await axios.post(
      `${API_URL}/recruitment/saved-talents/${talentId}/toggle?recruiter_id=${recruiterId}`
    );
    return response.data;
  },
};
