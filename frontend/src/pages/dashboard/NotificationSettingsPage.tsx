import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../../services/notification.service';
import { NotificationSettings } from '../../types/notification';

export const NotificationSettingsPage: React.FC = () => {
    const queryClient = useQueryClient();

    const { data: settings, isLoading } = useQuery({
        queryKey: ['notificationSettings'],
        queryFn: () => notificationService.getSettings()
    });

    const mutation = useMutation({
        mutationFn: (newSettings: Partial<NotificationSettings>) => notificationService.updateSettings(newSettings),
        onSuccess: (updatedSettings) => {
            queryClient.setQueryData(['notificationSettings'], updatedSettings);
        }
    });

    const handleToggle = (key: keyof NotificationSettings) => {
        if (!settings) return;
        mutation.mutate({ [key]: !settings[key] });
    };

    if (isLoading) return <div className="text-white p-6">Chargement des préférences...</div>;

    return (
        <div className="max-w-3xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white font-outfit">Préférences de Notifications</h1>
                <p className="text-gray-400 mt-2">Choisissez les alertes que vous souhaitez recevoir.</p>
            </div>

            <div className="space-y-4">
                <SettingRow 
                    title="Likes & Commentaires" 
                    description="Soyez averti lorsque quelqu'un interagit avec vos vidéos."
                    enabled={settings?.likes_enabled ?? true}
                    onToggle={() => handleToggle('likes_enabled')}
                    isUpdating={mutation.isPending}
                />
                <SettingRow 
                    title="Messagerie" 
                    description="Recevez une alerte pour chaque nouveau message privé."
                    enabled={settings?.messages_enabled ?? true}
                    onToggle={() => handleToggle('messages_enabled')}
                    isUpdating={mutation.isPending}
                />
                <SettingRow 
                    title="Recrutement & Favoris" 
                    description="Ne manquez aucune opportunité lorsqu'un recruteur s'intéresse à vous."
                    enabled={settings?.recruitment_enabled ?? true}
                    onToggle={() => handleToggle('recruitment_enabled')}
                    isUpdating={mutation.isPending}
                />
                <SettingRow 
                    title="Campagnes & Financement" 
                    description="Suivez l'évolution de vos collectes de fonds."
                    enabled={settings?.crowdfunding_enabled ?? true}
                    onToggle={() => handleToggle('crowdfunding_enabled')}
                    isUpdating={mutation.isPending}
                />
                
                <div className="my-8 border-t border-white/10" />
                
                <SettingRow 
                    title="Emails récapitulatifs" 
                    description="Recevez un e-mail hebdomadaire résumant votre activité."
                    enabled={settings?.emails_enabled ?? true}
                    onToggle={() => handleToggle('emails_enabled')}
                    isUpdating={mutation.isPending}
                />
            </div>
        </div>
    );
};

const SettingRow = ({ title, description, enabled, onToggle, isUpdating }: any) => (
    <div className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
        <div>
            <h3 className="text-white font-medium">{title}</h3>
            <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
        <button 
            onClick={onToggle}
            disabled={isUpdating}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0f] ${enabled ? 'bg-purple-600' : 'bg-gray-700'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
);
