export type VideoStatus = 'UPLOADING' | 'PROCESSING' | 'PENDING_CONSENT' | 'PUBLISHED' | 'REJECTED';

export interface Video {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  file_path: string;
  status: VideoStatus;
  transcription?: string;
  ai_tags?: string[];
  views_count: number;
  likes_count: number;
  created_at: string;
}

export interface CreatorInfo {
  id: string;
  first_name?: string;
  last_name?: string;
  trust_level: number;
}

export interface VideoFeedResponse extends Video {
  creator: CreatorInfo;
}

// ── Dashboard Analytics ────────────────────────────────────────────────────

export interface VideoAnalytics {
  id: string;
  title: string;
  description?: string;
  status: VideoStatus;
  views_count: number;
  likes_count: number;
  avg_watch_seconds: number;
  completion_rate: number;  // % des viewers qui regardent jusqu'au bout
  ai_tags: string[];
  created_at: string;
}

export interface TalentAnalytics {
  // KPIs globaux
  total_views: number;
  total_likes: number;
  engagement_rate: number;  // likes / views * 100
  total_videos: number;
  published_videos: number;
  pending_videos: number;
  rejected_videos: number;
  times_saved_as_favorite: number;
  recruiter_contacts: number;
  profile_views: number;   // préparé pour le futur
  // Détail par vidéo
  videos: VideoAnalytics[];
}
