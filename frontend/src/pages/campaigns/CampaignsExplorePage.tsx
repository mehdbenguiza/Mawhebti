import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const CATEGORIES = ['Tous', 'Musique', 'Sport', 'Art', 'Éducation', 'Technologie', 'Culture', 'Santé', 'Autre'];
const CATEGORY_EMOJIS: Record<string, string> = {
  Musique: '🎵', Sport: '⚽', Art: '🎨', Éducation: '📚', Technologie: '💻', Culture: '🎭', Santé: '🏥', Autre: '✨', Tous: '🌟'
};

const SORTS = [
  { value: 'recent',      label: 'Récentes' },
  { value: 'funded',      label: 'Plus financées' },
  { value: 'popular',     label: 'Populaires' },
  { value: 'ending_soon', label: 'Fin proche' },
];

// ─── localStorage helpers for visited private campaigns ───────────────────────
const LS_KEY = 'mawhebti_visited_private';
export function saveVisitedPrivate(campaign: any) {
  try {
    const stored: any[] = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    if (!stored.find((c) => c.id === campaign.id)) {
      stored.unshift({ ...campaign, _visitedAt: Date.now() });
      localStorage.setItem(LS_KEY, JSON.stringify(stored.slice(0, 20)));
    }
  } catch { /* noop */ }
}
function getVisitedPrivate(): any[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
}
// ─────────────────────────────────────────────────────────────────────────────

function getTimeLeft(endDate: string): string {
  if (!endDate) return '—';
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return 'Terminée';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days}j restants`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  return `${hours}h restantes`;
}

function CampaignCard({ campaign, isPrivate = false }: { campaign: any; isPrivate?: boolean }) {
  const current  = campaign.current_amount  ?? campaign.amount_collected ?? 0;
  const target   = campaign.target_amount   ?? campaign.goal_amount      ?? 1;
  const donors   = campaign.donors_count    ?? campaign.donor_count      ?? 0;
  const views    = campaign.views_count     ?? campaign.view_count       ?? 0;
  const cover    = campaign.cover_image     ?? campaign.cover_url;
  const progress = Math.min((current / target) * 100, 100);

  return (
    <div className={`group flex flex-col rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300 shadow-lg border ${
      isPrivate
        ? 'bg-violet-950/40 border-violet-500/30 shadow-violet-500/10'
        : 'bg-white/5 border-white/10'
    } backdrop-blur-md`}>

      {/* Cover */}
      <div className="h-44 relative overflow-hidden bg-gradient-to-br from-violet-900/50 to-blue-900/50 flex items-center justify-center">
        {cover ? (
          <img src={cover} alt={campaign.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <span className="text-5xl filter drop-shadow-lg">{CATEGORY_EMOJIS[campaign.category] || '✨'}</span>
        )}

        {/* Status badge */}
        {campaign.status === 'ACTIVE' && !isPrivate && (
          <div className="absolute top-3 right-3 bg-green-500/20 text-green-400 border border-green-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md">
            ✅ ACTIVE
          </div>
        )}

        {/* Private badge */}
        {isPrivate && (
          <div className="absolute top-3 left-3 bg-violet-600/80 text-white border border-violet-400/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md flex items-center gap-1">
            🔒 PRIVÉE
          </div>
        )}
        {campaign.visibility === 'UNLISTED' && !isPrivate && (
          <div className="absolute top-3 left-3 bg-orange-600/70 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md">
            🔗 NON RÉPERTORIÉE
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
          <span className={`px-2 py-0.5 rounded-md ${isPrivate ? 'bg-violet-500/20 text-violet-300' : 'bg-white/10'}`}>
            {campaign.category}
          </span>
          {campaign.location && <><span>•</span><span>📍 {campaign.location}</span></>}
        </div>
        <h3 className="text-base font-bold text-white mb-3 line-clamp-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
          {campaign.title}
        </h3>

        <div className="mt-auto space-y-3">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className={`font-bold ${isPrivate ? 'text-violet-300' : 'text-white'}`}>
                {current.toLocaleString('fr-TN')} TND
              </span>
              <span className="text-gray-500">/ {target.toLocaleString('fr-TN')} TND</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isPrivate ? 'bg-gradient-to-r from-violet-500 to-purple-400' : 'bg-gradient-to-r from-violet-600 to-blue-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-600 mt-0.5 text-right">{progress.toFixed(1)}%</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-1 text-center border-t border-white/10 pt-3">
            <div>
              <div className="text-[10px] text-gray-400">Temps</div>
              <div className="text-xs font-semibold text-white truncate">{getTimeLeft(campaign.end_date)}</div>
            </div>
            <div className="border-l border-white/10">
              <div className="text-[10px] text-gray-400">Dons</div>
              <div className="text-xs font-semibold text-white">👥 {donors}</div>
            </div>
            <div className="border-l border-white/10">
              <div className="text-[10px] text-gray-400">Vues</div>
              <div className="text-xs font-semibold text-white">👁 {views}</div>
            </div>
          </div>

          <Link
            to={`/campaigns/${campaign.id}`}
            className={`block w-full text-center py-2.5 rounded-xl font-bold text-white text-sm transition-all ${
              isPrivate
                ? 'bg-violet-600/80 hover:bg-violet-600 border border-violet-500/30'
                : 'bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90'
            }`}
          >
            {isPrivate ? '🔒 Voir la campagne privée' : 'Soutenir ce projet'}
          </Link>
        </div>
      </div>
    </div>
  );
}

export const CampaignsExplorePage: React.FC = () => {
  const navigate  = useNavigate();
  const user      = useAuthStore(s => s.user);
  const [title,    setTitle]    = useState('');
  const [category, setCategory] = useState('Tous');
  const [location, setLocation] = useState('');
  const [sort,     setSort]     = useState('recent');
  const [page,     setPage]     = useState(1);
  const [visitedPrivate, setVisitedPrivate] = useState<any[]>([]);
  const pageSize = 12;

  useEffect(() => {
    setVisitedPrivate(getVisitedPrivate());
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['campaigns-explore', title, category, location, sort, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        title,
        category: category === 'Tous' ? '' : category,
        location,
        sort,
        page:      page.toString(),
        page_size: pageSize.toString(),
      });
      const { data } = await api.get(`/campaigns/explore?${params}`);
      return data;
    },
    placeholderData: (prev: any) => prev
  });

  const items: any[]  = data?.items || [];
  const total         = data?.total  || 0;
  const totalPages    = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
            ← Retour
          </button>
          <span className="font-black text-white text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
            💰 Campagnes Mawhebti
          </span>
          {user ? (
            <Link to={`/dashboard/${user.role?.includes('TALENT') ? 'talent' : user.role === 'PARENT' ? 'parent' : 'recruiter'}/overview`}
              className="text-xs text-violet-400 hover:text-violet-300 font-semibold">
              Mon Dashboard →
            </Link>
          ) : (
            <Link to="/login" className="text-xs text-violet-400 font-semibold">Se connecter</Link>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* Hero */}
        <div className="text-center py-6">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
            🌟 Explorez les campagnes
          </h1>
          <p className="text-gray-400 text-base">Soutenez les talents tunisiens dans leurs projets artistiques et culturels.</p>
        </div>

        {/* ═══ Campagnes privées visitées ═════════════════════════════════ */}
        {visitedPrivate.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                🔒 Mes campagnes privées visitées
              </h2>
              <span className="text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">
                {visitedPrivate.length}
              </span>
              <button
                onClick={() => { localStorage.removeItem(LS_KEY); setVisitedPrivate([]); }}
                className="ml-auto text-xs text-gray-600 hover:text-red-400 transition-colors"
              >
                Effacer l'historique
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visitedPrivate.map((c) => (
                <CampaignCard key={c.id} campaign={c} isPrivate />
              ))}
            </div>
          </section>
        )}

        {/* ═══ Filtres ════════════════════════════════════════════════════ */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4">
          {/* Recherche */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Rechercher une campagne..."
              value={title}
              onChange={e => { setTitle(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Catégories */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); setPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    category === cat
                      ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/20'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {CATEGORY_EMOJIS[cat]} {cat}
                </button>
              ))}
            </div>

            {/* Localisation */}
            <input
              type="text"
              placeholder="📍 Ville..."
              value={location}
              onChange={e => { setLocation(e.target.value); setPage(1); }}
              className="flex-1 min-w-32 px-3 py-1.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 text-xs focus:outline-none focus:border-violet-500 transition-colors"
            />

            {/* Tri */}
            <select
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1); }}
              className="px-3 py-1.5 bg-black/30 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500 transition-colors"
            >
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* ═══ Résultats ══════════════════════════════════════════════════ */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-400">
              {isLoading ? 'Chargement...' : `${total} campagne${total > 1 ? 's' : ''} trouvée${total > 1 ? 's' : ''}`}
            </p>
            {user && (
              <button
                onClick={() => navigate(`/dashboard/${user.role?.includes('TALENT') ? 'talent' : 'parent'}/campaigns/new`)}
                className="text-xs px-4 py-2 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl font-bold text-white hover:opacity-90"
              >
                + Créer une campagne
              </button>
            )}
          </div>

          {error ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl text-center">
              Erreur lors du chargement des campagnes.
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-white/5 border border-white/10 h-80 animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
              <span className="text-6xl mb-4 block">🏜️</span>
              <h3 className="text-xl font-bold text-white mb-2">Aucune campagne trouvée</h3>
              <p className="text-gray-400 text-sm">Essayez de modifier vos filtres.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((campaign: any) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white disabled:opacity-40 hover:bg-white/10 transition-colors font-semibold text-sm"
              >
                ← Précédent
              </button>
              <span className="text-gray-400 text-sm">Page {page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white disabled:opacity-40 hover:bg-white/10 transition-colors font-semibold text-sm"
              >
                Suivant →
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
