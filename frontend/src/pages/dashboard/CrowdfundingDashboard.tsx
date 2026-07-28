import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

function getTimeLeft(endDate: string): string {
  if (!endDate) return '—';
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return 'Terminée';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days}j restants`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  return `${hours}h restantes`;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Brouillon',
  PENDING_REVIEW: 'En révision',
  ACTIVE: 'Active',
  PAUSED: 'Pause',
  REJECTED: 'Refusée',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  PENDING_REVIEW: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  ACTIVE: 'bg-green-500/20 text-green-300 border-green-500/30',
  PAUSED: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  REJECTED: 'bg-red-500/20 text-red-300 border-red-500/30',
  COMPLETED: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  CANCELLED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export function CrowdfundingDashboard() {
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['crowdfunding-mine'],
    queryFn: async () => {
      const { data } = await api.get('/campaigns/mine?page_size=50');
      return data;
    },
    staleTime: 30_000,
  });

  const campaigns: any[] = data?.items || [];

  // Calcul des stats globales à partir des vraies données
  const totalTarget = campaigns.reduce((s, c) => s + (c.target_amount ?? 0), 0);
  const totalCollected = campaigns.reduce((s, c) => s + (c.current_amount ?? 0), 0);
  const totalDonors = campaigns.reduce((s, c) => s + (c.donors_count ?? 0), 0);
  const totalViews = campaigns.reduce((s, c) => s + (c.views_count ?? 0), 0);
  const globalProgress = totalTarget > 0 ? (totalCollected / totalTarget) * 100 : 0;

  const copyInviteLink = async (id: string) => {
    try {
      const { data } = await api.get(`/campaigns/${id}/invite-link`);
      const url = `${window.location.origin}/campaigns/join/${data.invite_code}`;
      await navigator.clipboard.writeText(url);
      alert(`✅ Lien copié !\n${url}`);
    } catch {
      alert('Impossible de récupérer le lien.');
    }
  };

  const publishCampaign = async (id: string) => {
    try {
      await api.post(`/campaigns/${id}/publish`);
      refetch();
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Erreur lors de la soumission.');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8 text-white font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
            💰 Finance & Crowdfunding
          </h1>
          <p className="text-gray-400 text-sm">Gérez vos campagnes de financement participatif.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/campaigns/explore"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-semibold transition-colors border border-white/10"
          >
            🔍 Explorer
          </Link>
          <button
            onClick={() => navigate('../campaigns/new')}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-lg"
          >
            + Créer une campagne
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <p className="text-xs text-gray-400 mb-1">💵 Total Récolté</p>
            <p className="text-2xl font-black text-white">{totalCollected.toLocaleString('fr-TN')}</p>
            <p className="text-xs text-gray-500 mt-0.5">sur {totalTarget.toLocaleString('fr-TN')} TND</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <p className="text-xs text-gray-400 mb-1">📈 Progression</p>
            <p className="text-2xl font-black text-violet-400">{globalProgress.toFixed(1)}%</p>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
              <div
                className="bg-gradient-to-r from-violet-500 to-blue-500 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, globalProgress)}%` }}
              />
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <p className="text-xs text-gray-400 mb-1">👥 Donateurs</p>
            <p className="text-2xl font-black text-white">{totalDonors}</p>
            <p className="text-xs text-gray-500 mt-0.5">{campaigns.length} campagne{campaigns.length > 1 ? 's' : ''}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <p className="text-xs text-gray-400 mb-1">👁️ Vues totales</p>
            <p className="text-2xl font-black text-white">{totalViews.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">sur toutes les campagnes</p>
          </div>
        </div>
      )}

      {/* Liste des campagnes */}
      <div>
        <h2 className="text-lg font-black text-white mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Mes Campagnes
        </h2>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-36 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10 rounded-2xl border border-red-500/20 bg-red-500/5">
            <p className="text-red-400 text-sm font-semibold">Erreur de chargement des campagnes.</p>
            <button onClick={() => refetch()} className="mt-3 text-xs text-violet-400 underline">Réessayer</button>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-white/20 bg-white/5">
            <p className="text-4xl mb-3">💸</p>
            <p className="text-gray-300 font-bold text-sm mb-4">Aucune campagne pour l'instant</p>
            <button
              onClick={() => navigate('../campaigns/new')}
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-bold rounded-xl hover:opacity-90 shadow-lg"
            >
              Créer ma première campagne
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {campaigns.map((camp: any) => {
              const current = camp.current_amount ?? 0;
              const target = camp.target_amount ?? 1;
              const progress = Math.min((current / target) * 100, 100);
              const isPrivate = camp.visibility === 'PRIVATE' || camp.visibility === 'UNLISTED';

              return (
                <div
                  key={camp.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors flex flex-col justify-between"
                >
                  {/* Top */}
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-sm truncate">{camp.title}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          {camp.category && (
                            <span className="text-[10px] text-gray-500">{camp.category}</span>
                          )}
                          {isPrivate && (
                            <span className="text-[10px] text-purple-400 font-semibold">🔒 {camp.visibility}</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border shrink-0 ml-2 ${STATUS_COLOR[camp.status] || STATUS_COLOR.DRAFT}`}>
                        {STATUS_LABEL[camp.status] || camp.status}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold text-violet-400">{current.toLocaleString('fr-TN')} TND</span>
                        <span className="text-gray-500">{target.toLocaleString('fr-TN')} TND</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-600 to-blue-600 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                        <span>{progress.toFixed(1)}% financé</span>
                        <span>👥 {camp.donors_count ?? 0} donateurs · 👁 {camp.views_count ?? 0} vues · ⏱ {getTimeLeft(camp.end_date)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap mt-1">
                    <Link
                      to={`/campaigns/${camp.id}`}
                      className="flex-1 text-center py-2 bg-white/10 hover:bg-white/20 text-xs font-bold rounded-lg transition-colors"
                    >
                      Voir
                    </Link>
                    {isPrivate && (
                      <button
                        onClick={() => copyInviteLink(camp.id)}
                        className="flex-1 py-2 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30 text-xs font-bold rounded-lg transition-colors"
                      >
                        🔗 Lien privé
                      </button>
                    )}
                    {camp.status === 'DRAFT' && (
                      <button
                        onClick={() => publishCampaign(camp.id)}
                        className="flex-1 py-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 text-white text-xs font-bold rounded-lg"
                      >
                        📤 Soumettre
                      </button>
                    )}
                    {camp.status === 'ACTIVE' && (
                      <button
                        onClick={async () => { await api.post(`/campaigns/${camp.id}/pause`); refetch(); }}
                        className="flex-1 py-2 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 text-xs font-bold rounded-lg"
                      >
                        ⏸ Pause
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notice Sécurité */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 flex items-start gap-4">
        <span className="text-2xl shrink-0">🔐</span>
        <div>
          <h4 className="text-blue-400 font-bold text-sm mb-1">Architecture Zero Trust & Idempotente</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Toutes les transactions sont traitées de manière sécurisée et immuable. Si vous êtes un mineur,
            les fonds sont obligatoirement transférés vers le compte KYC vérifié de votre parent.
            Aucune opération n'est validée côté frontend — tout passe par des Webhooks sécurisés.
          </p>
        </div>
      </div>
    </div>
  );
}
