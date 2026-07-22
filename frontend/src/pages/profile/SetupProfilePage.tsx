import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../../services/profile.service';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const profileSchema = z.object({
  first_name: z.string().min(1, 'Prénom requis').max(100),
  last_name: z.string().min(1, 'Nom requis').max(100),
  bio: z.string().max(1000, 'Bio limitée à 1000 caractères').optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  skills: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export const SetupProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const mutation = useMutation({
    mutationFn: profileService.updateMyProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      navigate('/dashboard', { replace: true });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  const onSubmit = async (data: ProfileForm) => {
    const skills = data.skills
      ? data.skills.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20)
      : [];

    await mutation.mutateAsync({
      first_name: data.first_name,
      last_name: data.last_name,
      bio: data.bio || undefined,
      date_of_birth: data.date_of_birth || undefined,
      city: data.city || undefined,
      country: data.country || undefined,
      skills,
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10 animate-fadeInUp">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20">
            <span className="text-3xl">👋</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Bienvenue sur Mawhebti
          </h1>
          <p className="text-gray-400 text-base">
            Avant de commencer, parlons un peu de vous. Remplissez ces informations de base pour débloquer votre tableau de bord.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-6 sm:p-10 shadow-2xl animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Prénom *</label>
                <input
                  {...register('first_name')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none text-white placeholder-gray-600 text-sm"
                  placeholder="Votre prénom"
                />
                {errors.first_name && <p className="mt-1 text-xs text-red-400">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Nom *</label>
                <input
                  {...register('last_name')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none text-white placeholder-gray-600 text-sm"
                  placeholder="Votre nom"
                />
                {errors.last_name && <p className="mt-1 text-xs text-red-400">{errors.last_name.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Courte Biographie</label>
              <textarea
                {...register('bio')}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none text-white placeholder-gray-600 text-sm resize-none"
                placeholder="Décrivez-vous en quelques mots..."
              />
              {errors.bio && <p className="mt-1 text-xs text-red-400">{errors.bio.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Ville</label>
                <input
                  {...register('city')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none text-white placeholder-gray-600 text-sm"
                  placeholder="Ex: Tunis"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Date de naissance</label>
                <input
                  type="date"
                  {...register('date_of_birth')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none text-white text-sm"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            {user?.role !== 'PARENT' && user?.role !== 'RECRUITER' && (
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  Vos Talents
                  <span className="text-gray-500 font-normal text-xs">(séparés par des virgules)</span>
                </label>
                <input
                  {...register('skills')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none text-white placeholder-gray-600 text-sm"
                  placeholder="Ex: Chant, Guitare, Photographie"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="w-full mt-4 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-base hover:opacity-90 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(124,58,237,0.3)]"
            >
              {(isSubmitting || mutation.isPending) ? 'Création en cours...' : 'Terminer et découvrir mon espace 🚀'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
