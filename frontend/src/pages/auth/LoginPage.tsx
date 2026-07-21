import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await authService.login(data);
      useAuthStore.setState({ token: response.access_token });
      const user = await authService.getMe();
      setAuth(response.access_token, user);
      const roleMap: Record<string, string> = {
        TALENT_MINOR: '/dashboard/talent',
        TALENT_MAJOR: '/dashboard/talent',
        PARENT: '/dashboard/parent',
        RECRUITER: '/dashboard/recruiter',
        MODERATOR: '/dashboard/talent',
        ADMIN: '/dashboard/talent',
      };
      navigate(roleMap[user.role] ?? '/feed');
    } catch (err: any) {
      setError('root', {
        message: err.response?.data?.detail || 'Email ou mot de passe incorrect.',
      });
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: '#0a0a0f', fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Left panel: form ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative">

        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute rounded-full animate-blob"
            style={{
              width: '500px', height: '500px',
              top: '-200px', left: '-200px',
              background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 65%)',
              filter: 'blur(60px)',
            }}
          />
          <div
            className="absolute rounded-full animate-blob animation-delay-4000"
            style={{
              width: '400px', height: '400px',
              bottom: '-150px', right: '-100px',
              background: 'radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 65%)',
              filter: 'blur(50px)',
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-md">

          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <img
              src="/logo-complet.jfif"
              alt="Mawhebti"
              className="h-24 w-auto object-contain mb-2"
              style={{ borderRadius: '12px' }}
            />
            <p className="text-gray-400 text-sm mt-2 text-center">
              La plateforme des jeunes talents tunisiens
            </p>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl p-8"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.4), 0 0 60px rgba(124,58,237,0.08)',
            }}
          >
            <h1
              className="text-2xl font-black text-white mb-1"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Bon retour ! 👋
            </h1>
            <p className="text-gray-400 text-sm mb-8">
              Connectez-vous à votre espace Mawhebti
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

              {/* Global error */}
              {errors.root && (
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
                >
                  <span>⚠️</span>
                  <span>{errors.root.message}</span>
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-base">✉️</span>
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="vous@exemple.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder-gray-600 text-sm outline-none transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: errors.email
                        ? '1px solid rgba(239,68,68,0.5)'
                        : '1px solid rgba(255,255,255,0.1)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.border = '1px solid rgba(124,58,237,0.6)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.border = errors.email
                        ? '1px solid rgba(239,68,68,0.5)'
                        : '1px solid rgba(255,255,255,0.1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-base">🔒</span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3 rounded-xl text-white placeholder-gray-600 text-sm outline-none transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: errors.password
                        ? '1px solid rgba(239,68,68,0.5)'
                        : '1px solid rgba(255,255,255,0.1)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.border = '1px solid rgba(124,58,237,0.6)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.border = errors.password
                        ? '1px solid rgba(239,68,68,0.5)'
                        : '1px solid rgba(255,255,255,0.1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 mt-2"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                  boxShadow: '0 0 30px rgba(124,58,237,0.4)',
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Connexion en cours...
                  </span>
                ) : 'Se connecter →'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }}/>
              <span className="text-gray-600 text-xs">ou</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }}/>
            </div>

            {/* Register link */}
            <p className="text-center text-sm text-gray-500">
              Pas encore de compte ?{' '}
              <Link
                to="/register"
                className="font-semibold transition-colors"
                style={{ color: '#a78bfa' }}
                onMouseOver={(e) => e.currentTarget.style.color = '#7c3aed'}
                onMouseOut={(e) => e.currentTarget.style.color = '#a78bfa'}
              >
                Rejoindre Mawhebti
              </Link>
            </p>

            {/* Back to home */}
            <p className="text-center text-xs text-gray-700 mt-3">
              <Link to="/" className="hover:text-gray-500 transition-colors">
                ← Retour à l'accueil
              </Link>
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex justify-center gap-6 mt-8 text-xs text-gray-700">
            <span className="flex items-center gap-1.5">🛡️ Sécurisé</span>
            <span className="flex items-center gap-1.5">🇹🇳 Tunisie</span>
            <span className="flex items-center gap-1.5">🤖 IA intégrée</span>
          </div>
        </div>
      </div>

      {/* ── Right panel: visual (desktop only) ── */}
      <div
        className="hidden lg:flex flex-col justify-center items-center flex-1 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(37,99,235,0.12) 50%, rgba(20,184,166,0.1) 100%)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute rounded-full"
          style={{
            width: '600px', height: '600px',
            top: '-200px', right: '-200px',
            background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 60%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: '400px', height: '400px',
            bottom: '-100px', left: '-100px',
            background: 'radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 60%)',
            filter: 'blur(50px)',
          }}
        />

        <div className="relative z-10 text-center px-12 max-w-md">
          {/* Logo seul */}
          <img
            src="/logo.png"
            alt="Mawhebti Logo"
            className="w-40 h-40 object-contain mx-auto mb-8"
            style={{ filter: 'drop-shadow(0 0 40px rgba(124,58,237,0.4))' }}
          />

          <h2
            className="text-3xl font-black text-white mb-4"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Bienvenue sur{' '}
            <span
              style={{
                background: 'linear-gradient(135deg,#7c3aed,#2563eb,#14b8a6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Mawhebti
            </span>
          </h2>
          <p className="text-gray-400 text-base leading-relaxed mb-10">
            La première plateforme tunisienne qui connecte les jeunes talents avec des recruteurs professionnels, en toute sécurité.
          </p>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: '🎭', value: '1 247', label: 'Talents' },
              { icon: '🏢', value: '389', label: 'Recruteurs' },
              { icon: '🎬', value: '4 832', label: 'Vidéos' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-4 text-center"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-white font-bold text-sm">{s.value}</div>
                <div className="text-gray-500 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
