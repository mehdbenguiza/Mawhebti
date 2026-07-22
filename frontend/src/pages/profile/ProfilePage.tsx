import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../../services/profile.service';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : 'http://localhost:8000';

const fullProfileSchema = z.object({
  first_name: z.string().min(1, 'Prénom requis').max(100),
  last_name: z.string().min(1, 'Nom requis').max(100),
  bio: z.string().max(1000).optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  skills: z.string().optional(),
  phone_number: z.string().optional().or(z.literal('')),
});

type FullProfileForm = z.infer<typeof fullProfileSchema>;

export const ProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: profileService.getMyProfile,
    retry: false,
  });

  const profileMutation = useMutation({
    mutationFn: profileService.updateMyProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
  });

  const accountMutation = useMutation({
    mutationFn: authService.updateAccount,
    onSuccess: (updatedUser) => {
      useAuthStore.setState({ user: updatedUser });
    },
  });

  const avatarMutation = useMutation({
    mutationFn: profileService.uploadAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FullProfileForm>({
    resolver: zodResolver(fullProfileSchema),
  });

  useEffect(() => {
    if (profile) {
      reset({
        first_name: profile.first_name ?? '',
        last_name: profile.last_name ?? '',
        bio: profile.bio ?? '',
        date_of_birth: profile.date_of_birth ?? '',
        city: profile.city ?? '',
        country: profile.country ?? '',
        skills: profile.skills?.join(', ') ?? '',
        phone_number: user?.phone_number ?? '',
      });
    }
  }, [profile, user, reset]);

  const onSubmit = async (data: FullProfileForm) => {
    const skills = data.skills
      ? data.skills.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20)
      : [];

    await profileMutation.mutateAsync({
      first_name: data.first_name,
      last_name: data.last_name,
      bio: data.bio || undefined,
      date_of_birth: data.date_of_birth || undefined,
      city: data.city || undefined,
      country: data.country || undefined,
      skills,
    });

    if (data.phone_number !== user?.phone_number) {
      await accountMutation.mutateAsync({
        phone_number: data.phone_number || undefined,
      });
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await avatarMutation.mutateAsync(e.target.files[0]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const isSaving = isSubmitting || profileMutation.isPending || accountMutation.isPending;
  const isSuccess = profileMutation.isSuccess && (accountMutation.isIdle || accountMutation.isSuccess);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8 text-white font-sans">
      
      {/* Header Profile Card */}
      <div className="relative rounded-3xl overflow-hidden bg-white/5 border border-white/10 shadow-2xl backdrop-blur-md">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-purple-600/40 via-blue-600/40 to-teal-500/40 relative">
           <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
        </div>
        
        {/* Avatar & Basic Info */}
        <div className="px-8 pb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-12 relative z-10">
            {/* Avatar Upload */}
            <div 
              className="relative group w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-[#0a0a0f] bg-[#1a1a24] cursor-pointer shadow-xl flex-shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              {profile?.avatar_url ? (
                <img src={`${BASE_URL}${profile.avatar_url}`} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-purple-500 to-blue-500">
                  {(profile?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl">📸</span>
              </div>
              {avatarMutation.isPending && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange} 
              />
            </div>

            <div className="flex-1 pb-2">
              <h1 className="text-3xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {profile?.first_name} {profile?.last_name}
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
                  {user?.role.replace('_', ' ')}
                </span>
                {profile?.city && (
                  <>
                    <span>•</span>
                    <span>📍 {profile.city}, {profile.country}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isSuccess && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-sm font-medium flex items-center gap-3 shadow-lg animate-fadeInUp">
          <span>✅</span> Profil mis à jour avec succès !
        </div>
      )}
      {(profileMutation.isError || accountMutation.isError) && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium flex items-center gap-3 shadow-lg animate-fadeInUp">
          <span>❌</span> Une erreur est survenue lors de l'enregistrement.
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Section: Informations Publiques */}
        <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-6 sm:p-8 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span>👤</span> Informations Publiques
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Prénom</label>
              <input
                {...register('first_name')}
                className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none text-white text-sm"
              />
              {errors.first_name && <p className="mt-1 text-xs text-red-400">{errors.first_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Nom</label>
              <input
                {...register('last_name')}
                className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none text-white text-sm"
              />
              {errors.last_name && <p className="mt-1 text-xs text-red-400">{errors.last_name.message}</p>}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Biographie</label>
            <textarea
              {...register('bio')}
              rows={4}
              className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none text-white text-sm resize-y"
              placeholder="Racontez votre histoire..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Ville</label>
              <input
                {...register('city')}
                className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Pays</label>
              <input
                {...register('country')}
                className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Date de naissance</label>
              <input
                type="date"
                {...register('date_of_birth')}
                className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none text-white text-sm"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Compétences (séparées par des virgules)</label>
              <input
                {...register('skills')}
                className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none text-white text-sm"
                placeholder="Ex: Chant, Danse"
              />
            </div>
          </div>
        </div>

        {/* Section: Coordonnées & Téléphone */}
        <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-6 sm:p-8 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span>📱</span> Coordonnées
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Téléphone</label>
            <input
              type="tel"
              {...register('phone_number')}
              className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none text-white text-sm max-w-md"
              placeholder="+216 20 123 456"
            />
            <p className="mt-2 text-xs text-gray-500">
              Ce numéro ne sera partagé qu'avec les recruteurs authentifiés. L'adresse email se modifie dans les <b>Paramètres du compte</b>.
            </p>
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end pb-12">
          <button
            type="submit"
            disabled={!isDirty || isSaving}
            className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-[0_0_30px_rgba(124,58,237,0.3)] hover:scale-[1.02] active:scale-95"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>

      </form>
    </div>
  );
};
