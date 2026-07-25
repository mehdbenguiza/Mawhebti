export enum NotificationType {
    VIDEO_LIKED = "VIDEO_LIKED",
    VIDEO_COMMENTED = "VIDEO_COMMENTED",
    VIDEO_APPROVED = "VIDEO_APPROVED",
    VIDEO_REJECTED = "VIDEO_REJECTED",
    NEW_MESSAGE = "NEW_MESSAGE",
    MESSAGE_BLOCKED = "MESSAGE_BLOCKED",
    RECRUITMENT_REQUEST = "RECRUITMENT_REQUEST",
    RECRUITMENT_ACCEPTED = "RECRUITMENT_ACCEPTED",
    RECRUITMENT_REJECTED = "RECRUITMENT_REJECTED",
    RECRUITMENT_STAGE_CHANGED = "RECRUITMENT_STAGE_CHANGED",
    TALENT_SAVED = "TALENT_SAVED",
    DONATION_RECEIVED = "DONATION_RECEIVED",
    CAMPAIGN_COMPLETED = "CAMPAIGN_COMPLETED",
    CAMPAIGN_EXPIRED = "CAMPAIGN_EXPIRED",
    PROFILE_VERIFIED = "PROFILE_VERIFIED",
    ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED",
    SECURITY_ALERT = "SECURITY_ALERT",
    PASSWORD_CHANGED = "PASSWORD_CHANGED",
    LOGIN_NEW_DEVICE = "LOGIN_NEW_DEVICE",
    SYSTEM = "SYSTEM"
}

export enum NotificationPriority {
    LOW = "LOW",
    NORMAL = "NORMAL",
    HIGH = "HIGH",
    URGENT = "URGENT"
}

export enum NotificationCategory {
    SOCIAL = "SOCIAL",
    RECRUITMENT = "RECRUITMENT",
    SECURITY = "SECURITY",
    ADMINISTRATION = "ADMINISTRATION",
    CROWDFUNDING = "CROWDFUNDING"
}

export enum NotificationAction {
    OPEN = "OPEN",
    ACCEPT = "ACCEPT",
    DECLINE = "DECLINE",
    PAY = "PAY",
    VIEW = "VIEW",
    NONE = "NONE"
}

export enum EntityType {
    VIDEO = "VIDEO",
    MESSAGE = "MESSAGE",
    RECRUITMENT = "RECRUITMENT",
    PROFILE = "PROFILE",
    CAMPAIGN = "CAMPAIGN",
    SYSTEM = "SYSTEM"
}

export interface Notification {
    id: string;
    recipient_id: string;
    notification_type: NotificationType;
    priority: NotificationPriority;
    title: string;
    body: string;
    link?: string;
    category: NotificationCategory;
    entity_type?: EntityType;
    entity_id?: string;
    action_type: NotificationAction;
    created_by?: string;
    channels_sent: Record<string, boolean>;
    payload: Record<string, any>;
    is_seen: boolean;
    is_read: boolean;
    is_deleted: boolean;
    created_at: string;
    updated_at?: string;
}

export interface NotificationListResponse {
    items: Notification[];
    total: number;
    page: number;
    size: number;
}

export interface NotificationSummary {
    total: number;
    unread: number;
    unseen: number;
    high_priority: number;
    urgent: number;
}

export interface NotificationSettings {
    likes_enabled: boolean;
    messages_enabled: boolean;
    recruitment_enabled: boolean;
    crowdfunding_enabled: boolean;
    emails_enabled: boolean;
    user_id?: string;
    updated_at?: string;
}
