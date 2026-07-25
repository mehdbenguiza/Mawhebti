import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { notificationService } from '../../services/notification.service';
import { Notification, NotificationType } from '../../types/notification';

// Material Icons
import NotificationsIcon from '@mui/icons-material/Notifications';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CommentIcon from '@mui/icons-material/Comment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import MessageIcon from '@mui/icons-material/Message';
import BlockIcon from '@mui/icons-material/Block';
import WorkIcon from '@mui/icons-material/Work';
import StarIcon from '@mui/icons-material/Star';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';

const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
        case NotificationType.VIDEO_LIKED: return <FavoriteIcon className="text-red-500" fontSize="small" />;
        case NotificationType.VIDEO_COMMENTED: return <CommentIcon className="text-blue-500" fontSize="small" />;
        case NotificationType.VIDEO_APPROVED: return <CheckCircleIcon className="text-green-500" fontSize="small" />;
        case NotificationType.VIDEO_REJECTED: return <CancelIcon className="text-red-500" fontSize="small" />;
        case NotificationType.NEW_MESSAGE: return <MessageIcon className="text-purple-500" fontSize="small" />;
        case NotificationType.MESSAGE_BLOCKED: return <BlockIcon className="text-gray-500" fontSize="small" />;
        case NotificationType.RECRUITMENT_REQUEST: 
        case NotificationType.RECRUITMENT_ACCEPTED:
        case NotificationType.RECRUITMENT_STAGE_CHANGED:
            return <WorkIcon className="text-orange-500" fontSize="small" />;
        case NotificationType.TALENT_SAVED: return <StarIcon className="text-yellow-400" fontSize="small" />;
        case NotificationType.DONATION_RECEIVED: return <VolunteerActivismIcon className="text-pink-500" fontSize="small" />;
        case NotificationType.SECURITY_ALERT: return <WarningIcon className="text-red-600" fontSize="small" />;
        case NotificationType.PROFILE_VERIFIED: return <VerifiedUserIcon className="text-blue-600" fontSize="small" />;
        default: return <InfoIcon className="text-gray-400" fontSize="small" />;
    }
};

const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'À l\'instant';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Hier';
    return `Il y a ${diffInDays} jours`;
};

export const NotificationDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    
    const getBaseRoute = () => {
        if (!user) return '/dashboard';
        if (user.role.startsWith('TALENT')) return '/dashboard/talent';
        if (user.role === 'RECRUITER') return '/dashboard/recruiter';
        if (user.role === 'PARENT') return '/dashboard/parent';
        return '/dashboard';
    };

    // Polling Intelligent
    const { data: unreadCount = 0 } = useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: () => notificationService.getUnreadCount(),
        refetchInterval: document.visibilityState === 'visible' ? 15000 : false,
    });

    const { data: notificationsData } = useQuery({
        queryKey: ['notifications', 'list'],
        queryFn: () => notificationService.getNotifications(1, 5), // Charger les 5 dernières
        enabled: isOpen, // Ne charger que quand on ouvre
    });

    const markSeenMutation = useMutation({
        mutationFn: () => notificationService.markAllAsSeen(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
        }
    });

    const markReadMutation = useMutation({
        mutationFn: (id: string) => notificationService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
        }
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = () => {
        if (!isOpen && unreadCount > 0) {
            markSeenMutation.mutate(); // Marquer comme vu (le badge disparaît)
        }
        setIsOpen(!isOpen);
    };

    const handleNotificationClick = (notif: Notification) => {
        if (!notif.is_read) {
            markReadMutation.mutate(notif.id);
        }
        setIsOpen(false);
        if (notif.link) {
            navigate(notif.link);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={toggleDropdown}
                className="relative p-2 text-gray-300 hover:text-white transition-colors rounded-full hover:bg-white/10"
            >
                <NotificationsIcon />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1.5 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-[#0a0a0f]"></span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 lg:w-96 rounded-xl overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-top-2"
                     style={{
                         background: 'rgba(255, 255, 255, 0.05)',
                         backdropFilter: 'blur(24px)',
                         border: '1px solid rgba(255, 255, 255, 0.1)',
                     }}>
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <h3 className="font-semibold text-white font-outfit">Notifications</h3>
                        <button onClick={() => { setIsOpen(false); navigate(`${getBaseRoute()}/notifications/settings`); }} className="text-xs text-purple-400 hover:text-purple-300">
                            Préférences
                        </button>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {!notificationsData?.items || notificationsData.items.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                <NotificationsIcon className="mb-2 opacity-20" fontSize="large" />
                                <p>Aucune notification</p>
                            </div>
                        ) : (
                            notificationsData.items.map((notif) => (
                                <div 
                                    key={notif.id} 
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`p-4 border-b border-white/5 cursor-pointer transition-colors flex gap-3
                                        ${notif.is_read ? 'bg-transparent hover:bg-white/5' : 'bg-purple-500/10 hover:bg-purple-500/20'}`}
                                >
                                    <div className="mt-1 flex-shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                            {getNotificationIcon(notif.notification_type)}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${notif.is_read ? 'text-gray-300' : 'text-white'}`}>
                                            {notif.title}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                                            {notif.body}
                                        </p>
                                        <p className="text-[10px] text-gray-500 mt-1 font-mono">
                                            {formatRelativeTime(notif.created_at)}
                                        </p>
                                    </div>
                                    {!notif.is_read && (
                                        <div className="flex-shrink-0 self-center">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    
                    {notificationsData && notificationsData.total > 5 && (
                        <div 
                            className="p-3 text-center border-t border-white/10 cursor-pointer hover:bg-white/5 text-sm text-purple-400 transition-colors"
                            onClick={() => { setIsOpen(false); navigate(`${getBaseRoute()}/notifications`); }}
                        >
                            Voir toutes les notifications ({notificationsData.total})
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
