import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

function KpiCard({ icon, label, value, color = 'violet' }: any) {
  const g: Record<string, string> = {
    violet: 'from-violet-600/20 to-violet-600/5 border-violet-500/20',
    green:  'from-green-600/20 to-green-600/5 border-green-500/20',
    blue:   'from-blue-600/20 to-blue-600/5 border-blue-500/20',
    red:    'from-red-600/20 to-red-600/5 border-red-500/20',
    orange: 'from-orange-600/20 to-orange-600/5 border-orange-500/20',
    teal:   'from-teal-600/20 to-teal-600/5 border-teal-500/20',
  };
  return (
    <div className={`bg-gradient-to-br ${g[color]} border rounded-2xl p-5 backdrop-blur-md`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-xl font-black text-white">{value}</div>
      <div className="text-[10px] text-gray-400 mt-1">{label}</div>
    </div>
  );
}

export const FinanceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'stats' | 'withdrawals' | 'refunds'>('stats');
  const [rejectModal, setRejectModal] = useState<{ id: string; type: 'withdrawal' | 'donation' } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['finance-admin-stats'],
    queryFn: async () => { const { data } = await api.get('/payments/admin/stats'); return data; }
  });

  const { data: withdrawalsData } = useQuery({
    queryKey: ['admin-withdrawals'],
    enabled: activeTab === 'withdrawals',
    queryFn: async () => { const { data } = await api.get('/payments/admin/withdrawals'); return data; }
  });

  const { data: donationsData } = useQuery({
    queryKey: ['admin-donations'],
    enabled: activeTab === 'refunds',
    queryFn: async () => { const { data } = await api.get('/payments/admin/donations'); return data; }
  });

  const approveWithdrawal = useMutation({
    mutationFn: (id: string) => api.post(`/payments/admin/withdrawals/${id}/approve`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-withdrawals', 'finance-admin-stats'] })
  });

  const refundDonation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.post(`/payments/admin/donations/${id}/refund`, { reason }),
    onSuccess: () => { setRejectModal(null); queryClient.invalidateQueries({ queryKey: ['admin-donations', 'finance-admin-stats'] }); }
  });

  const TABS = [
    { key: 'stats',      label: '📊 Statistiques',        },
    { key: 'withdrawals',label: `💸 Retraits (${stats?.pending_withdrawals ?? '…'})` },
    { key: 'refunds',    label: '↩️ Remboursements' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans pb-16">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white text-sm">← Retour</button>
          <span className="font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>🛡️ Finance Admin</span>
          <span className="text-xs text-red-400 font-bold bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">ADMIN</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* KPIs */}
        {statsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard icon="💰" label="Volume total dons" value={`${(stats?.total_donations_tnd ?? 0).toLocaleString('fr-TN', { minimumFractionDigits: 2 })} TND`} color="violet" />
            <KpiCard icon="🏦" label="Commissions plateforme" value={`${(stats?.total_platform_fees_tnd ?? 0).toLocaleString('fr-TN', { minimumFractionDigits: 2 })} TND`} color="green" />
            <KpiCard icon="✅" label="Dons réussis" value={stats?.count_donations_success ?? 0} color="teal" />
            <KpiCard icon="❌" label="Dons échoués" value={stats?.count_donations_failed ?? 0} color="red" />
            <KpiCard icon="↩️" label="Remboursements" value={stats?.count_refunded ?? 0} color="orange" />
            <KpiCard icon="💸" label="Retraits en attente" value={stats?.pending_withdrawals ?? 0} color="blue" />
            <KpiCard icon="👛" label="Wallets actifs" value={stats?.total_wallets ?? 0} color="violet" />
            <KpiCard icon="🏧" label="Solde total wallets" value={`${(stats?.total_wallet_balance_tnd ?? 0).toLocaleString('fr-TN', { minimumFractionDigits: 2 })} TND`} color="green" />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 bg-white/5 border border-white/10 rounded-2xl p-2">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Retraits en attente */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-3">
            <h3 className="text-base font-black text-white">💸 Retraits à valider</h3>
            {!withdrawalsData?.items?.length ? (
              <div className="text-center py-10 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-gray-400 text-sm">Aucun retrait en attente. ✅</p>
              </div>
            ) : (
              withdrawalsData.items.filter((w: any) => w.status === 'REQUESTED').map((w: any) => (
                <div key={w.id} className="bg-white/5 border border-yellow-500/20 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="font-black text-white">{w.amount.toLocaleString('fr-TN', { minimumFractionDigits: 2 })} TND</div>
                    <div className="text-[10px] text-gray-500">Demandé le {new Date(w.requested_at).toLocaleDateString('fr-TN')}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveWithdrawal.mutate(w.id)}
                      className="px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold rounded-xl hover:bg-green-500/30"
                    >
                      ✅ Approuver
                    </button>
                    <button
                      onClick={() => setRejectModal({ id: w.id, type: 'withdrawal' })}
                      className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/30"
                    >
                      ❌ Refuser
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Remboursements */}
        {activeTab === 'refunds' && (
          <div className="space-y-3">
            <h3 className="text-base font-black text-white">↩️ Déclencher un remboursement</h3>
            {!donationsData?.items?.length ? (
              <div className="text-center py-10 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-gray-400 text-sm">Aucun don disponible.</p>
              </div>
            ) : (
              donationsData.items.filter((d: any) => d.status === 'SUCCESS').map((d: any) => (
                <div key={d.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">{d.amount.toLocaleString('fr-TN', { minimumFractionDigits: 2 })} TND</div>
                    <div className="text-[10px] text-gray-500">Don du {new Date(d.created_at).toLocaleDateString('fr-TN')}</div>
                  </div>
                  <button
                    onClick={() => setRejectModal({ id: d.id, type: 'donation' })}
                    className="px-4 py-2 bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold rounded-xl hover:bg-orange-500/30"
                  >
                    ↩️ Rembourser
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal raison */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#13131a] border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-base font-black text-white mb-3">
              {rejectModal.type === 'withdrawal' ? '❌ Refuser le retrait' : '↩️ Rembourser le don'}
            </h3>
            <label className="text-xs text-gray-400 font-bold mb-1.5 block">Raison (obligatoire)</label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Expliquez la raison..."
              className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-violet-500 resize-none h-24 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold">Annuler</button>
              <button
                onClick={() => {
                  if (rejectModal.type === 'donation') {
                    refundDonation.mutate({ id: rejectModal.id, reason: rejectReason });
                  } else {
                    setRejectModal(null);
                  }
                }}
                disabled={!rejectReason.trim()}
                className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-white text-sm font-black disabled:opacity-50"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
