import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const STATUS_WITHDRAWAL: Record<string, { label: string; color: string }> = {
  REQUESTED: { label: '⏳ En attente', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  APPROVED:  { label: '✅ Approuvé',   color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  REJECTED:  { label: '❌ Refusé',     color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  PROCESSING:{ label: '🔄 En cours',  color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  COMPLETED: { label: '💸 Effectué',  color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
};

export const WithdrawalPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => { const { data } = await api.get('/payments/wallet'); return data; }
  });

  const { data, isLoading } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: async () => { const { data } = await api.get('/payments/wallet/withdrawals'); return data; }
  });

  const withdrawals: any[] = data?.items || [];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans pb-16">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white text-sm">← Retour</button>
          <span className="font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>💸 Mes Retraits</span>
          <button onClick={() => navigate('/wallet')} className="text-xs text-violet-400 hover:text-violet-300">Mon Wallet →</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Info balance */}
        <div className="bg-gradient-to-br from-violet-600/20 to-blue-600/10 border border-violet-500/20 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Solde disponible</p>
            <div className="text-3xl font-black text-white mt-1">{(walletData?.available ?? 0).toLocaleString('fr-TN', { minimumFractionDigits: 2 })} <span className="text-violet-300 text-xl">TND</span></div>
          </div>
          <button
            onClick={() => navigate('/wallet')}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl font-bold text-white text-sm hover:opacity-90 transition-all"
          >
            💸 Demander un retrait
          </button>
        </div>

        {/* Infos processus */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-bold text-blue-300">ℹ️ Comment fonctionnent les retraits ?</p>
          <ul className="text-xs text-gray-400 space-y-1 list-none">
            <li>• Minimum : <span className="text-white font-semibold">10 TND</span> par retrait</li>
            <li>• Délai de traitement : <span className="text-white font-semibold">1 à 3 jours ouvrés</span></li>
            <li>• Les fonds sont virés sur votre RIB bancaire enregistré</li>
            <li>• Commission plateforme : <span className="text-violet-300 font-semibold">5%</span> déduite à la réception du don (pas au retrait)</li>
          </ul>
        </div>

        {/* Historique */}
        <div>
          <h2 className="text-lg font-black text-white mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>📋 Historique des retraits</h2>
          {isLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}</div>
          ) : !withdrawals.length ? (
            <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
              <span className="text-5xl block mb-3">💸</span>
              <p className="text-gray-400 text-sm">Aucun retrait effectué pour l'instant.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w: any) => {
                const st = STATUS_WITHDRAWAL[w.status] || { label: w.status, color: 'text-gray-400 bg-white/5 border-white/10' };
                return (
                  <div key={w.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{w.amount.toLocaleString('fr-TN', { minimumFractionDigits: 2 })} TND</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        Demandé le {new Date(w.requested_at).toLocaleDateString('fr-TN', { day: '2-digit', month: 'long', year: 'numeric' })}
                        {w.processed_at && ` · Traité le ${new Date(w.processed_at).toLocaleDateString('fr-TN')}`}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${st.color}`}>{st.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
