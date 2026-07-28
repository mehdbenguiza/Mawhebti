import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const CATEGORIES = ['Tous', 'Musique', 'Sport', 'Art', 'Éducation', 'Technologie', 'Culture', 'Santé', 'Autre'];
const CATEGORY_EMOJIS: Record<string, string> = {
  Musique: '🎵', Sport: '⚽', Art: '🎨', Éducation: '📚', Technologie: '💻', Culture: '🎭', Santé: '🏥', Autre: '✨', Tous: '🌟'
};

const SORTS = [
  { value: 'recent', label: 'Récentes' },
  { value: 'funded', label: 'Plus financées' },
  { value: 'popular', label: 'Populaires' },
  { value: 'ending_soon', label: 'Fin prochaine' }
];

function getTimeLeft(endDate: string): string {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return 'Terminée';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days} jour${days > 1 ? 's' : ''} restants`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  return `${hours}h restantes`;
}

interface Campaign {
  id: string;
  title: string;
  category: string;
  location: string;
  status: string;
  cover_url?: string;
  amount_collected: number;
  goal_amount: number;
  donor_count: number;
  view_count: number;
  end_date: string;
}

export const CampaignsExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Tous');
  const [location, setLocation] = useState('');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const fetchCampaigns = async () => {
    const params = new URLSearchParams({
      title,
      category: category === 'Tous' ? '' : category,
      location,
      sort,
      page: page.toString(),
      page_size: pageSize.toString()
    });
    const { data } = await api.get(`/campaigns/explore?${params}`);
    return data; // Assume { items: Campaign[], total: number } or similar
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['campaigns', title, category, location, sort, page],
    queryFn: fetchCampaigns,
    placeholderData: (previousData) => previousData
  });

  const items: Campaign[] = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            ← Retour
          </button>
          <span className="text-white font-bold text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>💰 Campagnes</span>
          {user ? (
            <Link
              to={`/dashboard/${user.role === 'TALENT_MINOR' || user.role === 'TALENT_MAJOR' ? 'talent' : user.role === 'PARENT' ? 'parent' : 'recruiter'}/overview`}
              className="text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors"
            >
              Mon Dashboard →
            </Link>
          ) : (
            <Link to="/login" className="text-xs text-violet-400 hover:text-violet-300 font-semibold">Se connecter</Link>
          )}
        </div>
      </nav>

      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-4 pt-4">
          <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-blue-600" style={{ fontFamily: "'Outfit', sans-serif" }}>
            🔍 Explorer les Campagnes
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Découvrez et soutenez les talents de demain. Participez au financement de projets créatifs et ambitieux.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
              <input 
                type="text" 
                placeholder="Rechercher une campagne..."
                value={title}
                onChange={(e) => { setTitle(e.target.value); setPage(1); }}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">📍</span>
              <input 
                type="text" 
                placeholder="Localisation (ex: Tunis)"
                value={location}
                onChange={(e) => { setLocation(e.target.value); setPage(1); }}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <select 
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500 transition-colors appearance-none md:w-48"
            >
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setPage(1); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${category === cat ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'}`}
              >
                {CATEGORY_EMOJIS[cat]} {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {error ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl text-center backdrop-blur-md">
            Oups ! Une erreur est survenue lors du chargement des campagnes.
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/5 border border-white/10 h-96 animate-pulse"></div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
            <span className="text-6xl mb-4 block">🏜️</span>
            <h3 className="text-xl font-bold text-white mb-2">Aucune campagne trouvée</h3>
            <p className="text-gray-400">Essayez de modifier vos filtres de recherche.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((campaign) => {
              const progress = Math.min((campaign.amount_collected / campaign.goal_amount) * 100, 100);
              return (
                <div key={campaign.id} className="group flex flex-col bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300 shadow-lg">
                  {/* Cover */}
                  <div className="h-48 relative overflow-hidden bg-gradient-to-br from-violet-900/50 to-blue-900/50 flex items-center justify-center">
                    {campaign.cover_url ? (
                      <img src={campaign.cover_url} alt={campaign.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <span className="text-6xl filter drop-shadow-lg">{CATEGORY_EMOJIS[campaign.category] || '✨'}</span>
                    )}
                    {campaign.status === 'ACTIVE' && (
                      <div className="absolute top-4 right-4 bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">
                        ACTIVE
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                      <span className="bg-white/10 px-2 py-1 rounded-md">{campaign.category}</span>
                      <span>•</span>
                      <span>📍 {campaign.location}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-4 line-clamp-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      {campaign.title}
                    </h3>
                    
                    <div className="mt-auto space-y-4">
                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-bold text-white">{campaign.amount_collected.toLocaleString('fr-TN')} TND</span>
                          <span className="text-gray-400">sur {campaign.goal_amount.toLocaleString('fr-TN')} TND</span>
                        </div>
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-violet-600 to-blue-600 rounded-full transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 text-center border-t border-white/10 pt-4">
                        <div>
                          <div className="text-xs text-gray-400">Temps restant</div>
                          <div className="text-sm font-semibold text-white truncate">{getTimeLeft(campaign.end_date)}</div>
                        </div>
                        <div className="border-l border-white/10">
                          <div className="text-xs text-gray-400">Donateurs</div>
                          <div className="text-sm font-semibold text-white">{campaign.donor_count}</div>
                        </div>
                        <div className="border-l border-white/10">
                          <div className="text-xs text-gray-400">Vues</div>
                          <div className="text-sm font-semibold text-white">{campaign.view_count}</div>
                        </div>
                      </div>

                      <Link 
                        to={`/campaigns/${campaign.id}`}
                        className="block w-full text-center py-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 rounded-xl font-bold text-white transition-opacity shadow-lg"
                      >
                        Soutenir ce projet
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-8">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white disabled:opacity-50 hover:bg-white/10 transition-colors"
            >
              Précédent
            </button>
            <span className="text-gray-400">Page {page} sur {totalPages}</span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white disabled:opacity-50 hover:bg-white/10 transition-colors"
            >
              Suivant
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
