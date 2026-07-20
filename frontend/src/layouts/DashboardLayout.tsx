import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const getNavLinks = (role: string | undefined) => {
  const links = [
    { to: '/feed', label: 'Explorer', icon: '📱' },
    { to: 'overview', label: 'Vue d\'ensemble', icon: '🏠' },
    { to: 'profile', label: 'Mon profil', icon: '👤' },
  ];
  if (role === 'TALENT_MINOR' || role === 'TALENT_MAJOR') {
    links.push({ to: 'upload', label: 'Publier une vidéo', icon: '🎥' });
  }
  return links;
};

/**
 * Layout principal de l'espace connecté.
 * Contient la Sidebar et le Header communs à tous les dashboards.
 */
export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const roleLabel: Record<string, string> = {
    TALENT_MINOR: 'Talent (Mineur)',
    TALENT_MAJOR: 'Talent (Majeur)',
    PARENT: 'Parent / Tuteur',
    RECRUITER: 'Recruteur',
    MODERATOR: 'Modérateur',
    ADMIN: 'Administrateur',
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } bg-gray-900 text-white flex flex-col transition-all duration-300 ease-in-out flex-shrink-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          {sidebarOpen && (
            <span className="text-xl font-bold text-blue-400">Mawhebti</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-lg hover:bg-gray-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {getNavLinks(user?.role).map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              <span className="text-lg">{link.icon}</span>
              {sidebarOpen && <span>{link.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User info + Logout */}
        <div className="border-t border-gray-700 p-4">
          {sidebarOpen && (
            <div className="mb-3">
              <p className="text-sm font-medium text-white truncate">{user?.email}</p>
              <p className="text-xs text-gray-400">{roleLabel[user?.role ?? ''] ?? user?.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <span>🚪</span>
            {sidebarOpen && <span>Se déconnecter</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-800">
            Bienvenue sur votre espace {roleLabel[user?.role ?? ''] ?? ''}
          </h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
