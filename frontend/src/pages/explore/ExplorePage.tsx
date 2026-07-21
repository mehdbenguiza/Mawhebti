import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TalentCard } from '../../components/ui/TalentCard';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

const fetchTalents = async (params: any) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.182.128:8000/api/v1';
  // Nettoyer les paramètres vides
  const cleanParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null && v !== ''));
  const response = await axios.get(`${API_URL}/talents/search`, { params: cleanParams });
  return response.data;
};

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [sort, setSort] = useState(searchParams.get('sort') || 'recent');
  const [category, setCategory] = useState(searchParams.get('category') || '');

  // Synchroniser l'URL lors du changement d'état (sauf page qui est synchrone)
  useEffect(() => {
    const params: Record<string, string> = {};
    if (query) params.query = query;
    if (city) params.city = city;
    if (category) params.category = category;
    if (sort !== 'recent') params.sort = sort;
    if (page > 1) params.page = page.toString();
    setSearchParams(params, { replace: true });
  }, [query, city, category, sort, page, setSearchParams]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['talents', { query, city, category, sort, page }],
    queryFn: () => fetchTalents({ query, city, category, sort, page }),
    placeholderData: (prev) => prev, // Garde les anciennes données pendant le chargement (pagination fluide)
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Retour à la première page lors d'une nouvelle recherche
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white py-12 px-4 sm:px-6 lg:px-8 font-sans relative">
      {/* Décors en arrière-plan */}
      <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* En-tête de la page */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Découvrez nos <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Talents</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Explorez les profils de la plateforme, parcourez leurs réalisations et trouvez la perle rare pour vos prochains projets.
          </p>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 mb-10 shadow-2xl">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un talent, une compétence, une bio..."
                className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none text-white transition-all"
              />
            </div>
            
            <div className="flex gap-4">
              <div className="relative w-full md:w-48">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">📍</span>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ville"
                  className="w-full pl-10 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none text-white transition-all"
                />
              </div>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full md:w-48 px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl focus:border-purple-500 outline-none text-white appearance-none cursor-pointer"
              >
                <option value="recent">Les plus récents</option>
                <option value="popular">Les plus populaires</option>
                <option value="recommended">Recommandés pour vous</option>
              </select>
            </div>
          </form>
          
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-white/5">
            <span className="text-sm font-semibold text-gray-400 mr-2">Catégories :</span>
            {['Sport', 'Musique', 'Tech', 'Art', 'Design'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategory(category === cat ? '' : cat);
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  category === cat 
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' 
                    : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Section Résultats */}
        {isLoading && !data ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="animate-spin h-10 w-10 text-purple-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-400">Recherche des talents en cours...</p>
          </div>
        ) : isError ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl text-center">
            <p className="text-3xl mb-2">😕</p>
            <p className="font-semibold">Une erreur est survenue lors de la recherche.</p>
            <p className="text-sm opacity-80 mt-1">{(error as any)?.message}</p>
          </div>
        ) : data?.items?.length === 0 ? (
          <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
            <p className="text-6xl mb-4 opacity-50">🔍</p>
            <h3 className="text-xl font-bold text-white mb-2">Aucun talent trouvé</h3>
            <p className="text-gray-400">Essayez de modifier vos critères de recherche.</p>
            <button 
              onClick={() => { setQuery(''); setCity(''); setCategory(''); }}
              className="mt-6 px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors font-semibold"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <p className="text-gray-400 mb-6 font-medium">
              <strong className="text-white">{data?.total}</strong> talent{data?.total > 1 ? 's' : ''} trouvé{data?.total > 1 ? 's' : ''}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.items.map((profile: any) => (
                <TalentCard 
                  key={profile.id}
                  id={profile.id}
                  firstName={profile.first_name || 'Talent'}
                  lastName={profile.last_name || ''}
                  avatarUrl={profile.avatar_url}
                  city={profile.city}
                  country={profile.country}
                  skills={profile.skills || []}
                  isVerified={profile.is_verified || false}
                  videoCount={Math.floor(Math.random() * 20)} // Mocked for display
                  aiScore={profile.ai_score || Math.floor(Math.random() * 40 + 60)} // Mocked for display
                />
              ))}
            </div>

            {/* Pagination */}
            {data?.total > data?.page_size && (
              <div className="mt-12 flex justify-center items-center gap-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Précédent
                </button>
                <span className="text-gray-400 font-medium">
                  Page <strong className="text-white">{page}</strong> sur {Math.ceil(data.total / data.page_size)}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(data.total / data.page_size)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
