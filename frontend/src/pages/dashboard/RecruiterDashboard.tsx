import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  recruitmentService,
  type RecruiterDashboardStats,
  type SavedTalentItem,
} from '../../services/recruitment.service';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-Components
// ─────────────────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  icon: string;
  label: string;
  value: number | string;
  color: 'indigo' | 'yellow' | 'green' | 'blue' | 'red';
  loading?: boolean;
}> = ({ icon, label, value, color, loading }) => {
  const styles: Record<string, string> = {
    indigo: 'from-indigo-600/20 to-indigo-600/5 border-indigo-500/20 text-indigo-400',
    yellow: 'from-yellow-600/20 to-yellow-600/5 border-yellow-500/20 text-yellow-400',
    green: 'from-green-600/20 to-green-600/5 border-green-500/20 text-green-400',
    blue: 'from-blue-600/20 to-blue-600/5 border-blue-500/20 text-blue-400',
    red: 'from-red-600/20 to-red-600/5 border-red-500/20 text-red-400',
  };

  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 flex flex-col justify-between shadow-lg hover:-translate-y-1 transition-transform duration-200 ${styles[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {loading ? (
          <div className="w-8 h-8 rounded-full border-2 border-current border-t-transparent animate-spin opacity-50" />
        ) : (
          <p className="text-3xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {value}
          </p>
        )}
      </div>
      <p className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</p>
    </div>
  );
};

const TalentAvatar: React.FC<{ talent: SavedTalentItem['talent'] }> = ({ talent }) => {
  const API_URL = (import.meta.env.VITE_API_URL || 'http://192.168.182.128:8000/api/v1').replace('/api/v1', '');
  const initials = `${talent.first_name?.[0] || ''}${talent.last_name?.[0] || ''}`.toUpperCase() || '?';
  const avatarSrc = talent.avatar_url ? `${API_URL}/${talent.avatar_url}` : null;

  if (avatarSrc) {
    return (
      <img
        src={avatarSrc}
        alt={initials}
        className="w-12 h-12 rounded-full object-cover border-2 border-white/10 flex-shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }

  return (
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 border-2 border-white/10">
      {initials || '?'}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Saved Talent Card
// ─────────────────────────────────────────────────────────────────────────────

const SavedTalentCard: React.FC<{
  item: SavedTalentItem;
  onUnsave: (talentId: string) => void;
  loading?: boolean;
}> = ({ item, onUnsave, loading }) => {
  const savedDate = new Date(item.saved_at).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="group flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all duration-200">
      <TalentAvatar talent={item.talent} />

      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm truncate">
          {item.talent.first_name} {item.talent.last_name}
          {!item.talent.first_name && !item.talent.last_name && (
            <span className="text-gray-400 font-normal">{item.talent.email}</span>
          )}
        </p>

        {item.talent.main_skill && (
          <span className="inline-block mt-1 px-2 py-0.5 bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[10px] font-bold rounded-full uppercase tracking-wide">
            {item.talent.main_skill}
          </span>
        )}

        <div className="flex items-center gap-2 mt-1.5">
          {item.talent.city && (
            <span className="text-gray-500 text-[10px] flex items-center gap-1">
              📍 {item.talent.city}
            </span>
          )}
          <span className="text-gray-600 text-[10px]">
            ⭐ {savedDate}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-shrink-0">
        <Link
          to="/feed"
          className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-[11px] font-bold rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          Voir profil
        </Link>
        <button
          onClick={() => onUnsave(item.talent.id)}
          disabled={loading}
          className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 text-gray-400 text-[11px] font-semibold rounded-lg transition-all disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? '...' : 'Retirer'}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export const RecruiterDashboard: React.FC = () => {
  const [unsavingIds, setUnsavingIds] = useState<Set<string>>(new Set());
  const [savedPage, setSavedPage] = useState(1);

  // Single API call for all dashboard stats
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery<RecruiterDashboardStats>({
    queryKey: ['recruiter-dashboard'],
    queryFn: recruitmentService.getDashboard,
    staleTime: 30_000, // 30s cache
  });

  // Saved talents list (paginated)
  const {
    data: savedPage_data,
    isLoading: savedLoading,
    refetch: refetchSaved,
  } = useQuery({
    queryKey: ['saved-talents', savedPage],
    queryFn: () => recruitmentService.getSavedTalents(savedPage, 6),
    staleTime: 15_000,
  });

  const handleUnsave = async (talentId: string) => {
    setUnsavingIds(prev => new Set(prev).add(talentId));
    try {
      await recruitmentService.toggleSavedTalent(talentId);
      refetchSaved();
      refetchStats();
    } catch (e) {
      console.error('Unsave error:', e);
    } finally {
      setUnsavingIds(prev => {
        const next = new Set(prev);
        next.delete(talentId);
        return next;
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-8 text-white font-sans">

      {/* Header */}
      <div>
        <h2
          className="text-3xl font-black text-white"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Espace Recruteur
        </h2>
        <p className="text-gray-400 mt-1 text-sm">
          Découvrez les talents, gérez vos favoris et vos demandes de contact.
        </p>
      </div>

      {/* Stats Grid — un seul appel API */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          icon="⭐"
          label="Favoris"
          value={stats?.saved_talents ?? 0}
          color="yellow"
          loading={statsLoading}
        />
        <StatCard
          icon="📬"
          label="En attente"
          value={stats?.pending_requests ?? 0}
          color="indigo"
          loading={statsLoading}
        />
        <StatCard
          icon="✅"
          label="Acceptées"
          value={stats?.accepted_requests ?? 0}
          color="green"
          loading={statsLoading}
        />
        <StatCard
          icon="❌"
          label="Refusées"
          value={stats?.rejected_requests ?? 0}
          color="red"
          loading={statsLoading}
        />
        <StatCard
          icon="💬"
          label="Conversations"
          value={stats?.active_conversations ?? 0}
          color="blue"
          loading={statsLoading}
        />
      </div>

      {/* Mes Favoris */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-xl font-black text-white"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            ⭐ Mes Talents Favoris
          </h3>
          {savedPage_data && savedPage_data.total > 0 && (
            <span className="text-gray-400 text-sm">
              {savedPage_data.total} talent{savedPage_data.total > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {savedLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : !savedPage_data || savedPage_data.items.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-white/5 border border-white/10 border-dashed">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-400 text-sm font-semibold">Aucun talent sauvegardé pour l'instant</p>
            <p className="text-gray-600 text-xs mt-1">Parcourez le feed et cliquez sur ⭐ pour sauvegarder des talents</p>
            <Link
              to="/feed"
              className="inline-block mt-4 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
            >
              Explorer le Feed 🎬
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {savedPage_data.items.map(item => (
                <SavedTalentCard
                  key={item.saved_id}
                  item={item}
                  onUnsave={handleUnsave}
                  loading={unsavingIds.has(item.talent.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {savedPage_data.pages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-6">
                <button
                  onClick={() => setSavedPage(p => Math.max(1, p - 1))}
                  disabled={savedPage === 1}
                  className="px-4 py-2 bg-white/5 border border-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← Précédent
                </button>
                <span className="text-gray-400 text-sm">
                  Page {savedPage_data.page} / {savedPage_data.pages}
                </span>
                <button
                  onClick={() => setSavedPage(p => Math.min(savedPage_data.pages, p + 1))}
                  disabled={savedPage >= savedPage_data.pages}
                  className="px-4 py-2 bg-white/5 border border-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant →
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Actions rapides */}
      <section>
        <h3
          className="text-xl font-black text-white mb-4"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          🚀 Actions rapides
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/feed"
            className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/20 hover:border-violet-500/40 transition-all group"
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">🎬</span>
            <div>
              <p className="font-bold text-white">Explorer le Feed</p>
              <p className="text-xs text-gray-400 mt-0.5">Découvrir de nouveaux talents</p>
            </div>
          </Link>
          <Link
            to="/dashboard/inbox"
            className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-teal-600/20 to-blue-600/20 border border-teal-500/20 hover:border-teal-500/40 transition-all group"
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">💬</span>
            <div>
              <p className="font-bold text-white">Messagerie</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {stats?.pending_requests
                  ? `${stats.pending_requests} demande(s) en attente`
                  : 'Voir vos conversations'}
              </p>
            </div>
          </Link>
        </div>
      </section>

    </div>
  );
};
