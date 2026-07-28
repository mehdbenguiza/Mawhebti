import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export const CampaignJoinPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: campaign, isLoading, error } = useQuery({
    queryKey: ['campaign-join', code],
    queryFn: async () => {
      const { data } = await api.get(`/campaigns/join/${code}`);
      return data;
    },
    enabled: !!code,
    retry: false
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-8 rounded-2xl backdrop-blur-md max-w-md text-center shadow-2xl">
          <span className="text-4xl block mb-4">❌</span>
          <h2 className="text-xl font-bold mb-2">Lien invalide ou expiré</h2>
          <p className="text-sm opacity-80 mb-6">Ce lien d'invitation privé n'est plus valide ou la campagne n'existe pas.</p>
          <button onClick={() => navigate('/campaigns/explore')} className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-xl font-bold text-red-300 transition-colors">
            Retour à l'exploration
          </button>
        </div>
      </div>
    );
  }

  const current = campaign.current_amount ?? campaign.amount_collected ?? 0;
  const target = campaign.target_amount ?? campaign.goal_amount ?? 1;
  const progress = Math.min((current / target) * 100, 100);

  return (
    <div className="min-h-screen bg-[#0a0a0f] font-sans relative overflow-hidden">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-xl">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
            ← Retour
          </button>
          <span className="text-white font-bold text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>🔒 Invitation Privée</span>
          <Link to="/campaigns/explore" className="text-xs text-violet-400 hover:text-violet-300 font-semibold">Explorer</Link>
        </div>
      </nav>

      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-56px)] relative">
      {/* Background blur elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl max-w-lg w-full shadow-2xl relative z-10 text-center">
        
        <div className="inline-block px-4 py-1.5 bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-full text-xs font-bold mb-6">
          🔒 Campagne Privée
        </div>

        <h1 className="text-3xl font-black text-white mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
          {campaign.title}
        </h1>
        
        <p className="text-gray-400 text-sm mb-8 line-clamp-3 leading-relaxed">
          {campaign.description || "Vous avez été invité à soutenir cette campagne exclusive."}
        </p>

        <div className="bg-black/30 rounded-2xl p-5 border border-white/5 mb-8 text-left">
          <div className="flex justify-between items-end mb-2">
            <div>
              <span className="text-2xl font-black text-white">{campaign.amount_collected.toLocaleString('fr-TN')} TND</span>
              <span className="text-xs text-gray-500 block">sur {campaign.goal_amount.toLocaleString('fr-TN')} TND</span>
            </div>
            <span className="text-lg font-bold text-violet-400">{progress.toFixed(1)}%</span>
          </div>
          <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-600 to-blue-600 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {user ? (
          <div className="space-y-4">
            <button 
              onClick={() => navigate(`/campaigns/${campaign.id}/donate`)} 
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 rounded-xl font-bold text-white transition-all shadow-lg shadow-violet-500/25"
            >
              💰 Soutenir ce projet
            </button>
            <button 
              onClick={() => navigate(`/campaigns/${campaign.id}`)}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-white transition-colors"
            >
              Voir les détails de la campagne
            </button>
          </div>
        ) : (
          <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-xl">
            <p className="text-blue-300 text-sm mb-4 font-medium">Vous devez être connecté pour participer à cette campagne privée.</p>
            <Link 
              to={`/login?redirect=/campaigns/join/${code}`}
              className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg"
            >
              Se connecter pour soutenir
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};
