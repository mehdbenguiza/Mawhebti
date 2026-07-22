import React, { useState } from 'react';
import { NavLink, Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '../services/profile.service';

const getNavLinks = (role: string | undefined) => {
  const links = [
    { to: '/feed',    label: 'Explorer',        icon: '🎬', desc: 'Fil d\'actualité' },
    { to: 'overview', label: 'Vue d\'ensemble',  icon: '⚡', desc: 'Tableau de bord'  },
    { to: 'inbox',    label: 'Messagerie',       icon: '💬', desc: 'Messages'         },
    { to: 'profile',  label: 'Mon profil',       icon: '👤', desc: 'Mes informations' },
  ];
  if (role === 'TALENT_MINOR' || role === 'TALENT_MAJOR') {
    links.push({ to: 'upload', label: 'Publier une vidéo', icon: '🎥', desc: 'Uploader' });
  }
  return links;
};

const roleLabel: Record<string, { label: string; color: string; bg: string }> = {
  TALENT_MINOR: { label: 'Talent · Mineur', color: '#2563eb', bg: 'rgba(37,99,235,0.12)' },
  TALENT_MAJOR: { label: 'Talent · Majeur', color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
  PARENT:       { label: 'Parent / Tuteur',  color: '#14b8a6', bg: 'rgba(20,184,166,0.12)' },
  RECRUITER:    { label: 'Recruteur',         color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  MODERATOR:    { label: 'Modérateur',        color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  ADMIN:        { label: 'Administrateur',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
};

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: profileService.getMyProfile,
    retry: false,
  });

  const isProfileComplete = profile && profile.first_name && profile.last_name;
  const isProfilePage = location.pathname.endsWith('/profile');

  React.useEffect(() => {
    if (!isLoading && !isProfileComplete && !isProfilePage) {
      navigate('profile', { replace: true });
    }
  }, [isLoading, isProfileComplete, isProfilePage, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const role = roleLabel[user?.role ?? ''] ?? { label: user?.role ?? '', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' };
  const initials = (user?.email ?? 'U')[0].toUpperCase();

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: '#0a0a0f', fontFamily: "'Inter', sans-serif" }}
    >
      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside
        className="flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out"
        style={{
          width: sidebarOpen ? '240px' : '68px',
          background: 'rgba(255,255,255,0.03)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Header: logo + toggle */}
        <div
          className="flex items-center h-16 px-3 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Link to="/" className="flex items-center gap-2 flex-1 min-w-0 group">
            <img
              src="/logo.png"
              alt="M"
              className="w-8 h-8 object-contain flex-shrink-0 transition-transform group-hover:scale-110"
              style={{ filter: 'drop-shadow(0 0 6px rgba(124,58,237,0.5))' }}
            />
            {sidebarOpen && (
              <span
                className="font-black text-base truncate"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  background: 'linear-gradient(135deg,#7c3aed,#2563eb)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Mawhebti
              </span>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-all"
            aria-label="Toggle sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={sidebarOpen ? 'M11 19l-7-7 7-7m8 14l-7-7 7-7' : 'M13 5l7 7-7 7M5 5l7 7-7 7'} />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {/* Home button */}
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-all group mb-3"
            style={{ background: 'transparent' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span className="text-base flex-shrink-0">🏠</span>
            {sidebarOpen && <span className="truncate">Accueil</span>}
          </Link>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 8px' }} />

          {getNavLinks(user?.role).map((link) => {
            const isDisabled = !isProfileComplete && !link.to.includes('profile');
            
            if (isDisabled) {
              return (
                <div
                  key={link.to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 cursor-not-allowed opacity-50"
                  title="Veuillez compléter votre profil pour y accéder"
                >
                  <span className="text-base flex-shrink-0">{link.icon}</span>
                  {sidebarOpen && (
                    <div className="flex-1 min-w-0">
                      <span className="truncate block">{link.label}</span>
                    </div>
                  )}
                  {sidebarOpen && <span className="text-xs">🔒</span>}
                </div>
              );
            }

            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                  }`
                }
                style={({ isActive }) => isActive ? {
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(37,99,235,0.2))',
                  border: '1px solid rgba(124,58,237,0.3)',
                  boxShadow: '0 0 20px rgba(124,58,237,0.1)',
                } : {}}
              >
                <span className="text-base flex-shrink-0">{link.icon}</span>
                {sidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <span className="truncate block">{link.label}</span>
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div
          className="flex-shrink-0 p-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          {sidebarOpen ? (
            <div
              className="p-3 rounded-xl mb-2"
              style={{ background: role.bg, border: `1px solid ${role.color}30` }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${role.color}, ${role.color}99)` }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{user?.email}</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: role.color }}>{role.label}</p>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white mx-auto mb-2"
              style={{ background: `linear-gradient(135deg, ${role.color}, ${role.color}99)` }}
            >
              {initials}
            </div>
          )}

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 transition-all duration-200"
            style={{ background: 'transparent' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span className="flex-shrink-0">🚪</span>
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* ═══════════ MAIN ═══════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header
          className="h-14 flex items-center justify-between px-6 flex-shrink-0"
          style={{
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-5 w-0.5 rounded-full"
              style={{ background: 'linear-gradient(to bottom, #7c3aed, #2563eb)' }}
            />
            <span className="text-white text-sm font-semibold">
              Espace {role.label}
            </span>
          </div>

          {/* Right: back to home + user chip */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            >
              ← Accueil
            </Link>

            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: role.bg, border: `1px solid ${role.color}30` }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${role.color}, ${role.color}99)` }}
              >
                {initials}
              </div>
              <span className="text-xs font-medium text-white truncate max-w-32 hidden sm:block">
                {user?.email}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ background: 'rgba(255,255,255,0.01)' }}
        >
          {(!isProfileComplete && isProfilePage) && (
            <div className="mx-6 mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3 shadow-lg animate-fadeInUp">
              <span className="text-xl">⚠️</span>
              <div>
                <h4 className="text-yellow-400 font-bold mb-1">Bienvenue sur Mawhebti !</h4>
                <p className="text-yellow-200/80 text-sm">Pour débloquer toutes les fonctionnalités de votre tableau de bord (messagerie, publication de vidéos, recherche), veuillez d'abord remplir vos informations de base (Nom, Prénom, etc.).</p>
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>

      {/* ═══════════ Logout confirm modal ═══════════ */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="rounded-2xl p-8 max-w-sm w-full mx-4"
            style={{
              background: 'rgba(15,15,25,0.95)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl text-center mb-4">👋</div>
            <h3 className="text-white font-bold text-xl text-center mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Vous déconnecter ?
            </h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              Vous serez redirigé vers la page d'accueil.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-300 hover:text-white transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}
              >
                Annuler
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 0 20px rgba(239,68,68,0.3)' }}
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
