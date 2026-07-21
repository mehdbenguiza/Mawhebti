import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string(),
  role: z.enum(['TALENT_MINOR', 'TALENT_MAJOR', 'PARENT', 'RECRUITER'], {
    required_error: 'Veuillez sélectionner un rôle',
  }),
  parent_email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone_number: z.string().optional().or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === 'TALENT_MINOR') {
    return !!data.parent_email && data.parent_email.trim() !== '';
  }
  return true;
}, {
  message: "L'email du parent est obligatoire pour les mineurs",
  path: ["parent_email"]
}).refine((data) => {
  if (data.role === 'PARENT') {
    return !!data.phone_number && data.phone_number.trim() !== '';
  }
  return true;
}, {
  message: "Le numéro de téléphone est obligatoire pour les parents",
  path: ["phone_number"]
});

type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterForm) => {
    try {
      await authService.register({
        email: data.email,
        password: data.password,
        role: data.role,
        parent_email: data.role === 'TALENT_MINOR' ? data.parent_email : undefined,
        phone_number: data.role === 'PARENT' ? data.phone_number : undefined,
      });
      navigate('/login', { state: { message: "Inscription réussie ! Veuillez vous connecter." } });
    } catch (err: any) {
      setError('root', {
        message: err.response?.data?.detail || 'Une erreur est survenue lors de l\'inscription',
      });
    }
  };

  const roles = [
    { value: 'TALENT_MAJOR', label: 'Talent (Majeur)', icon: '🎤', color: '#7c3aed' },
    { value: 'TALENT_MINOR', label: 'Talent (Mineur)', icon: '🎠', color: '#2563eb', badge: '⚠️' },
    { value: 'PARENT', label: 'Parent / Tuteur', icon: '👨‍👩‍👧', color: '#14b8a6' },
    { value: 'RECRUITER', label: 'Recruteur', icon: '🏢', color: '#f59e0b' }
  ] as const;

  return (
    <div className="min-h-screen flex bg-[#0a0a0f] font-sans" style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}>
      {/* Animated Blobs */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-teal-600/20 rounded-full blur-[150px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      {/* Left panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 relative z-10 py-12 overflow-y-auto">
        <div className="mx-auto w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/logo-complet.jfif" alt="Logo" className="h-20 w-auto object-contain mx-auto mb-6" style={{ borderRadius: '12px' }} />
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Rejoignez Mawhebti 🚀
            </h2>
            <p className="text-gray-400 text-sm">
              Créez votre compte en quelques minutes
            </p>
          </div>

          <div
            className="p-8 rounded-2xl relative"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.4), 0 0 60px rgba(124,58,237,0.08)'
            }}
          >
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {errors.root && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center">
                  {errors.root.message}
                </div>
              )}

              {/* Role Selector */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  Je suis un :
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {roles.map((r) => {
                    const isSelected = selectedRole === r.value;
                    return (
                      <button
                        type="button"
                        key={r.value}
                        onClick={() => setValue('role', r.value as any, { shouldValidate: true })}
                        style={{
                          borderColor: isSelected ? r.color : 'rgba(255,255,255,0.1)',
                          backgroundColor: isSelected ? `${r.color}20` : 'rgba(255,255,255,0.03)',
                        }}
                        className={`relative p-3 rounded-xl border text-left transition-all duration-200 hover:bg-white/5 flex flex-col items-center justify-center text-center gap-1 ${
                          isSelected ? 'shadow-lg' : ''
                        }`}
                      >
                        <span className="text-2xl">{r.icon}</span>
                        <span className="text-xs font-medium text-white">{r.label}</span>
                        {r.badge && (
                          <span className="absolute top-1 right-1 text-xs">{r.badge}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {errors.role && <p className="text-xs text-red-400">{errors.role.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">Adresse email</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-400 transition-colors">✉️</span>
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: errors.email ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    }}
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder-gray-500 text-sm outline-none transition-all focus:border-purple-500 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                    placeholder="vous@exemple.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
              </div>

              {/* Parent Phone (if PARENT) */}
              {selectedRole === 'PARENT' && (
                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-gray-300 mb-1.5">Numéro de téléphone</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-400 transition-colors">📱</span>
                    <input
                      id="phone_number"
                      type="tel"
                      {...register('phone_number')}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: errors.phone_number ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
                      }}
                      className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder-gray-500 text-sm outline-none transition-all focus:border-purple-500 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                      placeholder="+216 20 123 456"
                    />
                  </div>
                  {errors.phone_number && <p className="mt-1 text-xs text-red-400">{errors.phone_number.message}</p>}
                </div>
              )}

              {/* Parent Email (if TALENT_MINOR) */}
              {selectedRole === 'TALENT_MINOR' && (
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                    <p className="text-xs text-yellow-200/80 leading-relaxed text-center">
                      ⚠️ Pour des raisons de sécurité, votre compte nécessite l'approbation d'un tuteur légal.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="parent_email" className="block text-sm font-medium text-gray-300 mb-1.5">Email de votre parent/tuteur</label>
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-400 transition-colors">👨‍👩‍👧</span>
                      <input
                        id="parent_email"
                        type="email"
                        {...register('parent_email')}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: errors.parent_email ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
                        }}
                        className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder-gray-500 text-sm outline-none transition-all focus:border-purple-500 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                        placeholder="parent@exemple.com"
                      />
                    </div>
                    {errors.parent_email && <p className="mt-1 text-xs text-red-400">{errors.parent_email.message}</p>}
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">Mot de passe</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-400 transition-colors">🔒</span>
                  <input
                    id="password"
                    type="password"
                    {...register('password')}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: errors.password ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    }}
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder-gray-500 text-sm outline-none transition-all focus:border-purple-500 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1.5">Confirmer le mot de passe</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-400 transition-colors">🔐</span>
                  <input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword')}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: errors.confirmPassword ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    }}
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder-gray-500 text-sm outline-none transition-all focus:border-purple-500 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
                    placeholder="••••••••"
                  />
                </div>
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                  boxShadow: '0 0 30px rgba(124,58,237,0.4)'
                }}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                {isSubmitting ? 'Inscription...' : "S'inscrire"}
              </button>

              <div className="text-center mt-6">
                <Link to="/login" className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">
                  Déjà un compte ? Se connecter
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right panel - Decorative */}
      <div className="hidden lg:flex flex-1 relative bg-[#0f0f16] overflow-hidden border-l border-white/5 items-center justify-center">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 p-12 max-w-2xl text-center flex flex-col items-center">
          <img 
            src="/logo.png" 
            alt="Mawhebti Logo" 
            className="w-48 h-auto mb-12 drop-shadow-[0_0_30px_rgba(124,58,237,0.5)]"
          />
          
          <h2 className="text-4xl font-bold text-white mb-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Votre talent mérite d'être vu
          </h2>
          
          <p className="text-lg text-gray-400 mb-12 leading-relaxed">
            Rejoignez la première plateforme dédiée à la découverte et la promotion des jeunes talents en Tunisie.
          </p>

          <div className="grid grid-cols-3 gap-6 w-full">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-2xl">
              <div className="text-3xl font-bold text-purple-400 mb-1">1247</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Talents</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-2xl">
              <div className="text-3xl font-bold text-blue-400 mb-1">389</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Recruteurs</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-2xl">
              <div className="text-3xl font-bold text-teal-400 mb-1">4832</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Vidéos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
