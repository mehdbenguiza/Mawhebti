import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';

const accountSchema = z.object({
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  current_password: z.string().optional().or(z.literal('')),
  new_password: z.string().optional().or(z.literal('')),
});
type AccountForm = z.infer<typeof accountSchema>;

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();

  const accountMutation = useMutation({
    mutationFn: authService.updateAccount,
    onSuccess: (updatedUser) => {
      useAuthStore.setState({ user: updatedUser });
      resetAccount({ email: updatedUser.email, current_password: '', new_password: '' });
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
    }
  });

  const onSubmitAccount = async (data: AccountForm) => {
    await accountMutation.mutateAsync({
      email: data.email || undefined,
      current_password: data.current_password || undefined,
      new_password: data.new_password || undefined,
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 text-white font-sans">
      <div>
        <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Paramètres du compte</h2>
        <p className="text-gray-400 mt-2 text-sm">Gérez la sécurité de votre compte et vos identifiants.</p>
      </div>

      {accountMutation.isSuccess && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-sm font-medium flex items-center gap-3 shadow-lg">
          <span>✅</span> Compte mis à jour avec succès !
        </div>
      )}
      {accountMutation.isError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium flex items-center gap-3 shadow-lg">
          <span>❌</span> {(accountMutation.error as any)?.response?.data?.detail || "Une erreur est survenue."}
        </div>
      )}

      <div className="bg-white/5 backdrop-blur-md rounded-2xl shadow-xl border border-white/10 p-6 sm:p-8">
        <form onSubmit={handleSubmitAccount(onSubmitAccount)} className="space-y-6">
          
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Adresse Email</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">✉️</span>
              <input
                type="email"
                {...registerAccount('email')}
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none text-white text-sm"
              />
            </div>
            {accountErrors.email && <p className="mt-1 text-xs text-red-400">{accountErrors.email.message}</p>}
          </div>

          <div className="pt-6 border-t border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">Changer de mot de passe</h3>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-purple-200/80">
                🔒 Pour modifier votre email ou votre mot de passe, vous devez <b>obligatoirement</b> renseigner votre mot de passe actuel.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Mot de passe actuel</label>
                <input
                  type="password"
                  {...registerAccount('current_password')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none text-white text-sm"
                  placeholder="Obligatoire"
                />
                {accountErrors.current_password && <p className="mt-1 text-xs text-red-400">{accountErrors.current_password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Nouveau mot de passe</label>
                <input
                  type="password"
                  {...registerAccount('new_password')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none text-white text-sm"
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
              {(isSubmittingAccount || accountMutation.isPending) ? 'Mise à jour...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
