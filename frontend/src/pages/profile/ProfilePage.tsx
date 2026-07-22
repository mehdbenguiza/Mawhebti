import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../../services/profile.service';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';

const accountSchema = z.object({
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone_number: z.string().optional().or(z.literal('')),
  current_password: z.string().optional().or(z.literal('')),
  new_password: z.string().optional().or(z.literal('')),
});
type AccountForm = z.infer<typeof accountSchema>;

const profileSchema = z.object({
  first_name: z.string().min(1, 'Prénom requis').max(100).optional().or(z.literal('')),
  last_name: z.string().min(1, 'Nom requis').max(100).optional().or(z.literal('')),
  bio: z.string().max(1000, 'Bio limitée à 1000 caractères').optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  skills: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export const ProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, setAuth } = useAuthStore();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: profileService.getMyProfile,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });

  const mutation = useMutation({
    mutationFn: profileService.updateMyProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  const accountMutation = useMutation({
    mutationFn: authService.updateAccount,
    onSuccess: (updatedUser) => {
      useAuthStore.setState({ user: updatedUser });
      resetAccount({ email: updatedUser.email, phone_number: updatedUser.phone_number || '', current_password: '', new_password: '' });
    },
  });

  const {
    register: registerAccount,
    handleSubmit: handleSubmitAccount,
    reset: resetAccount,
    formState: { errors: accountErrors, isSubmitting: isSubmittingAccount, isDirty: isAccountDirty },
  } = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      email: user?.email || '',
      phone_number: user?.phone_number || '',
    }
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
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileForm) => {
    const skills = data.skills
      ? data.skills.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20)
      : [];

    await mutation.mutateAsync({
      first_name: data.first_name || undefined,
      last_name: data.last_name || undefined,
      bio: data.bio || undefined,
      date_of_birth: data.date_of_birth || undefined,
      city: data.city || undefined,
      country: data.country || undefined,
      skills,
    });
  };

  const onSubmitAccount = async (data: AccountForm) => {
    await accountMutation.mutateAsync({
      email: data.email || undefined,
      phone_number: data.phone_number || undefined,
      current_password: data.current_password || undefined,
      new_password: data.new_password || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 text-white font-sans">
      <div>
        <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Mon profil</h2>
        <p className="text-gray-400 mt-2 text-sm">Ces informations seront visibles par les recruteurs et sur votre page.</p>
      </div>

      {mutation.isSuccess && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-sm font-medium flex items-center gap-3 shadow-lg">
          <span>✅</span> Profil mis à jour avec succès !
        </div>
      )}
      {mutation.isError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium flex items-center gap-3 shadow-lg">
          <span>❌</span> Une erreur est survenue. Veuillez réessayer.
        </div>
      )}

      <div className="bg-white/5 backdrop-blur-md rounded-2xl shadow-xl border border-white/10 p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Prénom</label>
              <input
                {...register('first_name')}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-white placeholder-gray-600 text-sm"
                placeholder="Votre prénom"
              />
              {errors.first_name && <p className="mt-1 text-xs text-red-400">{errors.first_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Nom</label>
              <input
                {...register('last_name')}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-white placeholder-gray-600 text-sm"
                placeholder="Votre nom"
              />
              {errors.last_name && <p className="mt-1 text-xs text-red-400">{errors.last_name.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Bio</label>
            <textarea
              {...register('bio')}
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-white placeholder-gray-600 text-sm resize-y"
              placeholder="Parlez-nous de vous, de votre parcours, de votre passion..."
            />
            {errors.bio && <p className="mt-1 text-xs text-red-400">{errors.bio.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Ville</label>
              <input
                {...register('city')}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-white placeholder-gray-600 text-sm"
                placeholder="Tunis, Sfax, Sousse..."
              />
              {errors.city && <p className="mt-1 text-xs text-red-400">{errors.city.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Pays</label>
              <input
                {...register('country')}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-white placeholder-gray-600 text-sm"
                placeholder="Tunisie"
              />
              {errors.country && <p className="mt-1 text-xs text-red-400">{errors.country.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Date de naissance
            </label>
            <input
              type="date"
              {...register('date_of_birth')}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-white text-sm"
              style={{ colorScheme: 'dark' }}
            />
            {errors.date_of_birth && <p className="mt-1 text-xs text-red-400">{errors.date_of_birth.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
              Compétences / Talents
              <span className="text-gray-500 font-normal text-xs">(séparées par des virgules)</span>
            </label>
            <input
              {...register('skills')}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-white placeholder-gray-600 text-sm"
              placeholder="Ex: Chant, Piano classique, Danse contemporaine"
            />
          </div>

          <div className="flex justify-end pt-6 border-t border-white/10">
            <button
              type="submit"
              disabled={(!isDirty && !!profile) || isSubmitting || mutation.isPending}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 shadow-[0_0_20px_rgba(124,58,237,0.3)] text-white rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 text-sm hover:scale-[1.02] active:scale-95"
            >
              {(isSubmitting || mutation.isPending) ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enregistrement...
                </>
              ) : (
                'Enregistrer les modifications'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Paramètres du Compte ── */}
      <div className="pt-8">
        <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Paramètres de connexion</h2>
        <p className="text-gray-400 text-sm mb-6">Gérez votre adresse email, numéro de téléphone et mot de passe.</p>

        {accountMutation.isSuccess && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-sm font-medium flex items-center gap-3 shadow-lg mb-6">
            <span>✅</span> Compte mis à jour avec succès !
          </div>
        )}
        {accountMutation.isError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium flex items-center gap-3 shadow-lg mb-6">
            <span>❌</span> {(accountMutation.error as any)?.response?.data?.detail || "Une erreur est survenue."}
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-md rounded-2xl shadow-xl border border-white/10 p-6 sm:p-8">
          <form onSubmit={handleSubmitAccount(onSubmitAccount)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  {...registerAccount('email')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-white text-sm"
                />
                {accountErrors.email && <p className="mt-1 text-xs text-red-400">{accountErrors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Téléphone</label>
                <input
                  type="tel"
                  {...registerAccount('phone_number')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-white text-sm"
                />
                {accountErrors.phone_number && <p className="mt-1 text-xs text-red-400">{accountErrors.phone_number.message}</p>}
              </div>
            </div>

            <div className="pt-6 border-t border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Changer de mot de passe</h3>
              <p className="text-sm text-gray-400 mb-4">Pour modifier votre email ou votre mot de passe, veuillez obligatoirement saisir votre mot de passe actuel.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Mot de passe actuel</label>
                  <input
                    type="password"
                    {...registerAccount('current_password')}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-white text-sm"
                    placeholder="Obligatoire"
                  />
                  {accountErrors.current_password && <p className="mt-1 text-xs text-red-400">{accountErrors.current_password.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Nouveau mot de passe</label>
                  <input
                    type="password"
                    {...registerAccount('new_password')}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-white text-sm"
                    placeholder="Laissez vide pour conserver l'actuel"
                  />
                  {accountErrors.new_password && <p className="mt-1 text-xs text-red-400">{accountErrors.new_password.message}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-white/10">
              <button
                type="submit"
                disabled={!isAccountDirty || isSubmittingAccount || accountMutation.isPending}
                className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 shadow-[0_0_20px_rgba(0,0,0,0.3)] text-white rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm hover:scale-[1.02] active:scale-95"
              >
                {(isSubmittingAccount || accountMutation.isPending) ? 'Mise à jour...' : 'Mettre à jour le compte'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
