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
