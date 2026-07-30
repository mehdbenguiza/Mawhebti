import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

function StatCard({ icon, label, value, sub, color = 'violet' }: any) {
  const colors: Record<string, string> = {
    violet: 'from-violet-600/20 to-violet-600/5 border-violet-500/20',
    green:  'from-green-600/20 to-green-600/5 border-green-500/20',
    blue:   'from-blue-600/20 to-blue-600/5 border-blue-500/20',
    orange: 'from-orange-600/20 to-orange-600/5 border-orange-500/20',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 backdrop-blur-md`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-xs text-gray-400 font-semibold mt-1">{label}</div>
      {sub && <div className="text-[10px] text-gray-600 mt-0.5">{sub}</div>}
    </div>
  );
}

export const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: wallet, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => { const { data } = await api.get('/payments/wallet'); return data; }
  });

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

  const withdrawMutation = useMutation({
    mutationFn: (amount: number) => api.post('/payments/wallet/withdraw', { amount, reason: 'Retrait demandé' }),
    onSuccess: () => {
      setShowWithdraw(false);
      setWithdrawAmount('');
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
    },
    onError: (e: any) => setWithdrawError(e?.response?.data?.detail || 'Erreur lors du retrait.')
  });

  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeProvider, setRechargeProvider] = useState('konnect');
  const [rechargeError, setRechargeError] = useState('');

  const rechargeMutation = useMutation({
    mutationFn: (data: { amount: number, provider: string }) => api.post('/payments/wallet/recharge', data),
    onSuccess: ({ data }) => {
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    },
    onError: (e: any) => setRechargeError(e?.response?.data?.detail || 'Erreur lors de la création de la recharge.')
  });

  const txTypeLabel: Record<string, string> = {
    CREDIT: '⬆️ Crédit',
    DEBIT: '⬇️ Débit',
    LOCK: '🔒 Bloqué',
    UNLOCK: '🔓 Libéré',
  };
  const txTypeColor: Record<string, string> = {
    CREDIT: 'text-green-400',
    DEBIT: 'text-red-400',
    LOCK: 'text-orange-400',
    UNLOCK: 'text-blue-400',
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans pb-16">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white text-sm transition-colors">← Retour</button>
          <span className="font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>💳 Mon Wallet</span>
          <button onClick={() => navigate('/wallet/withdrawals')} className="text-xs text-violet-400 hover:text-violet-300">Retraits →</button>
        </div>
      </nav>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-600/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Solde principal */}
        <div className="bg-gradient-to-br from-violet-600/20 to-blue-600/10 border border-violet-500/20 rounded-3xl p-8 text-center backdrop-blur-md">
          <p className="text-gray-400 text-sm mb-2">Solde disponible</p>
          <div className="text-5xl font-black text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {(wallet?.available ?? 0).toLocaleString('fr-TN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-violet-300 font-bold text-lg">TND</div>

          <div className="grid grid-cols-2 gap-4 mt-6 text-center">
            <div className="bg-black/20 rounded-2xl p-3">
              <div className="text-sm font-bold text-orange-300">{(wallet?.pending ?? 0).toLocaleString('fr-TN', { minimumFractionDigits: 2 })} TND</div>
              <div className="text-[10px] text-gray-500 mt-0.5">⏳ En attente</div>
            </div>
            <div className="bg-black/20 rounded-2xl p-3">
              <div className="text-sm font-bold text-red-300">{(wallet?.locked ?? 0).toLocaleString('fr-TN', { minimumFractionDigits: 2 })} TND</div>
              <div className="text-[10px] text-gray-500 mt-0.5">🔒 Bloqué</div>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setShowRecharge(true)}
              className="flex-1 py-3.5 bg-white/10 border border-white/20 rounded-xl font-black text-white hover:bg-white/20 transition-all"
            >
              ➕ Recharger
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              disabled={(wallet?.available ?? 0) < 10}
              className="flex-1 py-3.5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl font-black text-white disabled:opacity-40 hover:opacity-90 transition-all shadow-lg shadow-violet-500/20"
            >
              💸 Retrait
            </button>
          </div>
          {(wallet?.available ?? 0) < 10 && (
            <p className="text-[10px] text-gray-600 mt-2">Minimum 10 TND pour un retrait</p>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard icon="💰" label="Total reçu" value={`${(wallet?.total_received ?? 0).toLocaleString('fr-TN', { minimumFractionDigits: 2 })} TND`} color="green" />
          <StatCard icon="💸" label="Total retiré" value={`${(wallet?.total_withdrawn ?? 0).toLocaleString('fr-TN', { minimumFractionDigits: 2 })} TND`} color="orange" />
          <StatCard icon="🏦" label="Devise" value="TND" sub="Dinar Tunisien" color="blue" />
        </div>

        {/* Transactions */}
        <div>
          <h2 className="text-lg font-black text-white mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
            📋 Historique des transactions
          </h2>
          {!wallet?.transactions?.length ? (
            <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
              <span className="text-4xl block mb-3">💳</span>
              <p className="text-gray-400 text-sm">Aucune transaction pour l'instant.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {wallet.transactions.map((t: any) => (
                <div key={t.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`text-sm font-bold ${txTypeColor[t.type] || 'text-gray-400'}`}>
                      {txTypeLabel[t.type] || t.type}
                    </div>
                    <div className="text-xs text-gray-500 hidden sm:block truncate max-w-xs">{t.description}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-black ${t.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'}`}>
                      {t.type === 'CREDIT' ? '+' : '-'}{t.amount.toLocaleString('fr-TN', { minimumFractionDigits: 2 })} TND
                    </div>
                    <div className="text-[10px] text-gray-600">
                      {new Date(t.created_at).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal retrait */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#13131a] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-black text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>💸 Demander un retrait</h3>
            <p className="text-xs text-gray-400 mb-4">Solde disponible : <span className="text-violet-300 font-bold">{(wallet?.available ?? 0).toLocaleString('fr-TN', { minimumFractionDigits: 2 })} TND</span></p>

            <label className="text-xs text-gray-400 font-bold mb-1.5 block">Montant (min. 10 TND)</label>
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">TND</span>
              <input
                type="number" min="10" max={wallet?.available ?? 0} step="0.01"
                value={withdrawAmount}
                onChange={e => { setWithdrawAmount(e.target.value); setWithdrawError(''); }}
                placeholder="Montant..."
                className="w-full pl-14 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            {withdrawError && (
              <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{withdrawError}</div>
            )}

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4">
              <p className="text-xs text-yellow-300">⚠️ Le retrait sera examiné par notre équipe (1-3 jours ouvrés). Les fonds seront virés sur votre RIB enregistré.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowWithdraw(false); setWithdrawError(''); }} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold hover:bg-white/10">Annuler</button>
              <button
                onClick={() => withdrawMutation.mutate(parseFloat(withdrawAmount))}
                disabled={!withdrawAmount || parseFloat(withdrawAmount) < 10 || withdrawMutation.isPending}
                className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white text-sm font-black disabled:opacity-50"
              >
                {withdrawMutation.isPending ? 'Traitement...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Recharge */}
      {showRecharge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#13131a] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-black text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>➕ Recharger mon solde</h3>
            <p className="text-xs text-gray-400 mb-4">Ajoutez des fonds pour soutenir vos talents préférés.</p>

            <label className="text-xs text-gray-400 font-bold mb-1.5 block">Montant</label>
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">TND</span>
              <input
                type="number" min="1" step="0.5"
                value={rechargeAmount}
                onChange={e => { setRechargeAmount(e.target.value); setRechargeError(''); }}
                placeholder="Montant..."
                className="w-full pl-14 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <label className="text-xs text-gray-400 font-bold mb-1.5 block">Méthode de paiement</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {['mock', 'konnect', 'flouci', 'stripe'].map(prov => (
                <button
                  key={prov}
                  onClick={() => setRechargeProvider(prov)}
                  className={`py-2 rounded-xl text-xs font-bold transition-colors ${rechargeProvider === prov ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-400 border border-white/10'}`}
                >
                  {prov.charAt(0).toUpperCase() + prov.slice(1)}
                </button>
              ))}
            </div>

            {rechargeError && (
              <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{rechargeError}</div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setShowRecharge(false); setRechargeError(''); }} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold hover:bg-white/10">Annuler</button>
              <button
                onClick={() => rechargeMutation.mutate({ amount: parseFloat(rechargeAmount), provider: rechargeProvider })}
                disabled={!rechargeAmount || parseFloat(rechargeAmount) <= 0 || rechargeMutation.isPending}
                className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white text-sm font-black disabled:opacity-50"
              >
                {rechargeMutation.isPending ? 'Patientez...' : 'Continuer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

