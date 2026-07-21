import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

const fetchPublicProfile = async (id: string) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.182.128:8000/api/v1';
  const response = await axios.get(`${API_URL}/talents/${id}`);
  return response.data;
};

export const PublicProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['talent', id],
    queryFn: () => fetchPublicProfile(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center">
        <svg className="animate-spin h-12 w-12 text-purple-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-400 font-medium">Chargement du portfolio...</p>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-8 rounded-3xl max-w-md text-center">
          <p className="text-5xl mb-4">😕</p>
          <h2 className="text-2xl font-bold text-white mb-2">Profil introuvable</h2>
          <p className="text-gray-400 mb-6">Ce profil n'existe pas, a été suspendu ou n'est plus public.</p>
          <button onClick={() => navigate('/explore')} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors">
            Retour à l'exploration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans pb-20 relative">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-80 bg-gradient-to-b from-purple-900/30 to-transparent pointer-events-none" />
      
      {/* Navbar simplifiée */}
      <div className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 py-4 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-medium">
            <span>←</span> Retour
          </button>
          
          <div className="flex items-center gap-3">
            <button className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-yellow-400/20 hover:text-yellow-400 transition-colors" title="Ajouter aux favoris">
              ⭐
            </button>
            <button className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors" title="Partager">
              🔗
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-12 relative z-10 space-y-8">
        
        {/* Header Profile */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="w-32 h-32 md:w-40 md:h-40 shrink-0 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 p-1">
            <div className="w-full h-full rounded-full bg-[#13131a] flex items-center justify-center overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl font-bold text-white/30">{profile.first_name?.[0] || '?'}{profile.last_name?.[0] || '?'}</span>
              )}
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-3 mb-2 justify-center md:justify-start">
              <h1 className="text-3xl md:text-4xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {profile.first_name || 'Talent'} {profile.last_name}
              </h1>
              {profile.is_verified && (
                <span className="bg-teal-500/20 text-teal-400 border border-teal-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  ✓ Vérifié
                </span>
              )}
            </div>
            
            {(profile.city || profile.country) && (
              <p className="text-gray-400 font-medium mb-4 flex items-center justify-center md:justify-start gap-2">
                <span>📍</span> {[profile.city, profile.country].filter(Boolean).join(', ')}
              </p>
            )}

            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
              {/* Le bouton contacter dépend du rôle */}
              {(user?.role === 'RECRUITER' || user?.role === 'ADMIN') ? (
                <button className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:scale-105 transition-all">
                  ✉️ Contacter
                </button>
              ) : (
                <button 
                  disabled 
                  className="px-8 py-3 bg-white/5 border border-white/10 text-gray-500 font-bold rounded-xl cursor-not-allowed"
                  title="Connectez-vous avec un compte Recruteur pour contacter ce talent"
                >
                  ✉️ Contacter
                </button>
              )}
              <button className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/10 transition-colors">
                💰 Soutenir (Dons)
              </button>
            </div>
          </div>
        </div>

        {/* Bio & Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="md:col-span-2 space-y-8">
            {/* Biographie */}
            {profile.bio && (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span>📝</span> À propos
                </h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Vidéos / Portfolio (Mocked for MVP visualization) */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span>🎥</span> Portfolio Vidéo
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="aspect-video bg-black/40 rounded-xl border border-white/5 flex items-center justify-center group cursor-pointer overflow-hidden relative">
                   <div className="absolute inset-0 bg-purple-500/20 mix-blend-overlay"></div>
                   <span className="text-4xl group-hover:scale-125 transition-transform drop-shadow-lg">▶️</span>
                </div>
                <div className="aspect-video bg-black/40 rounded-xl border border-white/5 flex items-center justify-center group cursor-pointer overflow-hidden relative">
                   <div className="absolute inset-0 bg-blue-500/20 mix-blend-overlay"></div>
                   <span className="text-4xl group-hover:scale-125 transition-transform drop-shadow-lg">▶️</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Compétences */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl">
              <h3 className="text-lg font-bold text-white mb-4">Compétences</h3>
              {profile.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill: string, idx: number) => (
                    <span key={idx} className="bg-purple-500/20 border border-purple-500/30 text-purple-300 px-3 py-1.5 rounded-lg text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">Aucune compétence renseignée</p>
              )}
            </div>

            {/* Stats (Mock) */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl">
              <h3 className="text-lg font-bold text-white mb-4">Activité</h3>
              <ul className="space-y-4">
                <li className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Vues du profil</span>
                  <span className="font-bold text-white">1,240</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Score IA</span>
                  <span className="font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">Excellente</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
