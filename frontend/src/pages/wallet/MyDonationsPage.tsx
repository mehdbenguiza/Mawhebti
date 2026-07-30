import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  SUCCESS:    { label: '✅ Réussi',       color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  PENDING:    { label: '⏳ En attente',   color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  FAILED:     { label: '❌ Échoué',       color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  REFUNDED:   { label: '↩️ Remboursé',   color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  PROCESSING: { label: '🔄 En cours',    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
};

export const MyDonationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['my-donations', page],
    queryFn: async () => { const { data } = await api.get(`/payments/my-donations?page=${page}&page_size=20`); return data; }
  });

  const donations: any[] = data?.items || [];
  const total = data?.total || 0;
  const totalGiven = data?.total_given_tnd || 0;
  const avgDonation = donations.filter(d => d.status === 'SUCCESS').length > 0
    ? totalGiven / donations.filter(d => d.status === 'SUCCESS').length : 0;

  // Campaings lookup cache
  const [campaignNames, setCampaignNames] = React.useState<Record<string, string>>({});
  React.useEffect(() => {
    donations.forEach(async (d) => {
      if (d.campaign_id && !campaignNames[d.campaign_id]) {
        try {
          const { data: c } = await api.get(`/campaigns/${d.campaign_id}`);
          setCampaignNames(prev => ({ ...prev, [d.campaign_id]: c.title }));
        } catch { /* noop */ }
      }
    });
  }, [donations]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans pb-16">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white text-sm transition-colors">← Retour</button>
          <span className="font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>🎁 Mes Dons</span>
          <Link to="/wallet" className="text-xs text-violet-400 hover:text-violet-300">Mon Wallet →</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: '💰', label: 'Total donné', value: `${totalGiven.toLocaleString('fr-TN', { minimumFractionDigits: 2 })} TND`, color: 'from-violet-600/20 to-violet-600/5 border-violet-500/20' },
            { icon: '🎯', label: 'Campagnes soutenues', value: total, color: 'from-blue-600/20 to-blue-600/5 border-blue-500/20' },
            { icon: '📊', label: 'Don moyen', value: `${avgDonation.toLocaleString('fr-TN', { minimumFractionDigits: 2 })} TND`, color: 'from-green-600/20 to-green-600/5 border-green-500/20' },
            { icon: '📅', label: 'Dernier don', value: donations[0] ? new Date(donations[0].created_at).toLocaleDateString('fr-TN') : '—', color: 'from-orange-600/20 to-orange-600/5 border-orange-500/20' },
          ].map((k, i) => (
            <div key={i} className={`bg-gradient-to-br ${k.color} border rounded-2xl p-4 backdrop-blur-md`}>
              <div className="text-xl mb-1">{k.icon}</div>
              <div className="text-lg font-black text-white">{k.value}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div>
          <h2 className="text-lg font-black text-white mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
            📋 Historique complet
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
          ) : !donations.length ? (
            <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
              <span className="text-5xl block mb-3">🤍</span>
              <h3 className="text-lg font-bold text-white mb-2">Aucun don effectué</h3>
              <p className="text-gray-400 text-sm mb-4">Découvrez les campagnes et soutenez des talents !</p>
              <Link to="/campaigns/explore" className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white font-bold text-sm">
                Explorer les campagnes
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {donations.map((d: any) => {
                const st = STATUS_LABELS[d.status] || { label: d.status, color: 'text-gray-400 bg-white/5 border-white/10' };
                return (
                  <div key={d.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:bg-white/8 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm truncate">
                        {campaignNames[d.campaign_id] || '🔄 Chargement...'}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {new Date(d.created_at).toLocaleDateString('fr-TN', { day: '2-digit', month: 'long', year: 'numeric' })}
                        {d.anonymous && <span className="ml-2 text-gray-600">• Don anonyme</span>}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${st.color} shrink-0`}>{st.label}</span>
                    <div className="text-right shrink-0">
                      <div className="font-black text-white">{d.amount.toLocaleString('fr-TN', { minimumFractionDigits: 2 })} TND</div>
                      <Link to={`/campaigns/${d.campaign_id}`} className="text-[10px] text-violet-400 hover:underline">Voir campagne →</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {total > 20 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-white/10">← Précédent</button>
              <span className="text-gray-400 text-sm">Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={donations.length < 20}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-white/10">Suivant →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
