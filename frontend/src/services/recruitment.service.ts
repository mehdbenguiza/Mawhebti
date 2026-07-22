/**
 * RecruitmentService — Toutes les opérations de recrutement.
 *
 * Architecture :
 * - Utilise exclusivement `api` (axios avec intercepteur Bearer token automatique).
 * - Aucun `user_id` ne vient du frontend — le backend le lit depuis le JWT.
 * - Aucun `axios` direct : tout passe par api.ts.
 */
import api from './api';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RecruiterDashboardStats {
  saved_talents: number;
  pending_requests: number;
  accepted_requests: number;
  rejected_requests: number;
  active_conversations: number;
}

export interface SavedTalentItem {
  saved_id: string;
  saved_at: string;
  talent: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    city: string | null;
    main_skill: string | null;
    skills: string[];
  };
}

export interface SavedTalentsPage {
  items: SavedTalentItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

export const recruitmentService = {
  // ── Dashboard ──────────────────────────────────────────────────────────────

  /** Un seul appel pour alimenter tout le dashboard recruteur */
  getDashboard: async (): Promise<RecruiterDashboardStats> => {
    const res = await api.get('/recruitment/dashboard');
    return res.data;
  },

  // ── Favoris ────────────────────────────────────────────────────────────────

  /** Liste paginée des talents sauvegardés */
  getSavedTalents: async (page = 1, pageSize = 12): Promise<SavedTalentsPage> => {
    const res = await api.get(`/recruitment/saved-talents?page=${page}&page_size=${pageSize}`);
    return res.data;
  },

  /** Sauvegarder ou retirer un talent des favoris */
  toggleSavedTalent: async (talentId: string): Promise<{ action: 'saved' | 'removed'; talent_id: string }> => {
    const res = await api.post(`/recruitment/saved-talents/${talentId}/toggle`);
    return res.data;
  },

  // ── Demandes de contact ────────────────────────────────────────────────────

  createContactRequest: async (talentId: string, message: string) => {
    const res = await api.post(
      `/recruitment/requests?subject_talent_id=${talentId}&message=${encodeURIComponent(message)}`
    );
    return res.data;
  },

  acceptContactRequest: async (requestId: string) => {
    const res = await api.post(`/recruitment/requests/${requestId}/accept`);
    return res.data;
  },

  rejectContactRequest: async (requestId: string) => {
    const res = await api.post(`/recruitment/requests/${requestId}/reject`);
    return res.data;
  },

  getRequests: async () => {
    const res = await api.get('/recruitment/requests');
    return res.data;
  },

  // ── Messagerie ─────────────────────────────────────────────────────────────

  getConversations: async () => {
    const res = await api.get('/conversations/');
    return res.data;
  },

  getMessages: async (conversationId: string) => {
    const res = await api.get(`/conversations/${conversationId}/messages`);
    return res.data;
  },

  sendMessage: async (conversationId: string, content: string) => {
    const res = await api.post(
      `/conversations/${conversationId}/messages?content=${encodeURIComponent(content)}`
    );
    return res.data;
  },
};
