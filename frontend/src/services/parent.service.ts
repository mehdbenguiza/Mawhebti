import api from './api';
import type { ParentChildLink, LinkParentRequest } from '../types/parent';

export const parentService = {
  linkParent: async (data: LinkParentRequest): Promise<ParentChildLink> => {
    const response = await api.post('/parents/link', data);
    return response.data;
  },

  getRequests: async (): Promise<ParentChildLink[]> => {
    const response = await api.get('/parents/requests');
    return response.data;
  },

  handleRequest: async (linkId: string, action: 'approve' | 'reject'): Promise<ParentChildLink> => {
    const response = await api.put(`/parents/requests/${linkId}?action=${action}`);
    return response.data;
  },
};
