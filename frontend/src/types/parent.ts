export type LinkStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ParentChildLink {
  id: string;
  parent_id: string;
  child_id: string;
  status: LinkStatus;
  created_at: string;
}

export interface LinkParentRequest {
  parent_email: string;
}
