import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const PRESETS = [20, 50, 100, 200, 500];

export function CampaignCheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: campaign } = useQuery({
    queryKey: ['campaign-donate', id],
    queryFn: async () => {
      const { data } = await api.get(`/campaigns/${id}`);
      return data;
    },
    enabled: !!id
  });

  const finalAmount = customAmount ? parseFloat(customAmount) : amount;

  const handleDonate = async () => {
    if (!user) {
      navigate(`/login?redirect=/campaigns/${id}/donate`);
      return;
    }

    if (!finalAmount || finalAmount < 5) {
      setError('Le montant minimum est de 5 TND.');
      return;
    }

    if (finalAmount > 50000) {
      setError('Le montant maximum par transaction est de 50 000 TND.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.post(`/campaigns/${id}/donate`, {
        amount: finalAmount,
        currency: 'TND',
        message: message.trim() || null,
        anonymous,
      });

      if (response.data?.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else if (response.data?.success) {
        navigate(`/campaigns/${id}?donated=true`);
      } else {
        throw new Error("Erreur d'initialisation du paiement");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur de paiement. Veuillez réessayer.');
      setLoading(false);
    }
  };

  const target = campaign?.target_amount ?? 0;
  const current = campaign?.current_amount ?? 0;
  const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-xl">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
            ← Retour
          </button>
          <span className="text-white font-bold text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>💰 Faire un don</span>
          <Link to="/campaigns/explore" className="text-xs text-violet-400 hover:text-violet-300 font-semibold">Explorer</Link>
        </div>
      </nav>

      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex items-start justify-center px-4 py-8 min-h-[calc(100vh-56px)]">
        <div className="w-full max-w-lg space-y-4">

          {/* Campaign Info Card */}
          {campaign && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
              <h2 className="font-black text-white text-lg mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {campaign.title}
              </h2>
              <p className="text-xs text-gray-400 mb-3">par {campaign.creator_name || 'Talent Mawhebti'}</p>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-violet-400 font-bold">{current.toLocaleString('fr-TN')} TND récoltés</span>
                <span className="text-gray-500">objectif : {target.toLocaleString('fr-TN')} TND</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-600 to-blue-600 rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">{progress.toFixed(1)}% financé · 👥 {campaign.donors_count ?? 0} donateurs</p>
            </div>
          )}

          {/* Donation Form */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <h1 className="text-xl font-black text-white text-center mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
              ❤️ Soutenir ce projet
            </h1>
            <p className="text-gray-400 text-center text-sm mb-6">
              Choisissez un montant en Dinar Tunisien (TND)
            </p>

            {/* Montants prédéfinis */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => { setAmount(preset); setCustomAmount(''); setError(null); }}
                  className={`py-3 rounded-xl font-bold text-sm transition-all ${
                    amount === preset && !customAmount
                      ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/30 scale-105'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-gray-500 mb-4">TND</p>

            {/* Montant libre */}
            <div className="relative mb-5">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400 text-sm font-bold">TND</span>
              </div>
              <input
                type="number"
                min="5"
                max="50000"
                placeholder="Autre montant (min. 5 TND)"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  if (e.target.value) setAmount(0);
                  setError(null);
                }}
                className="w-full pl-14 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors text-sm"
              />
            </div>

            {/* Message */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 font-bold mb-1.5 block">Message (optionnel)</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={200}
                placeholder="Un mot d'encouragement pour le talent..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-violet-500 resize-none h-20"
              />
            </div>

            {/* Anonyme */}
            <label className="flex items-center gap-3 mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={e => setAnonymous(e.target.checked)}
                className="w-4 h-4 rounded accent-violet-600"
              />
              <span className="text-sm text-gray-300">Don anonyme (votre nom n'apparaîtra pas)</span>
            </label>

            {/* Résumé */}
            <div className="bg-black/30 border border-white/5 rounded-xl p-4 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Montant du don</span>
                <span className="text-white font-black text-lg">{(finalAmount || 0).toLocaleString('fr-TN')} TND</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-gray-500 text-xs">Devise</span>
                <span className="text-gray-300 text-xs font-bold">Dinar Tunisien (TND)</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <p>{error}</p>
              </div>
            )}

            <button
              onClick={handleDonate}
              disabled={loading || !finalAmount || finalAmount < 5}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 rounded-xl text-white font-black text-base transition-all shadow-lg shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Traitement...
                </span>
              ) : (
                `💳 Payer ${(finalAmount || 0).toLocaleString('fr-TN')} TND`
              )}
            </button>

            {!user && (
              <p className="text-center text-xs text-gray-500 mt-3">
                Vous devez être{' '}
                <Link to={`/login?redirect=/campaigns/${id}/donate`} className="text-violet-400 underline">
                  connecté
                </Link>{' '}
                pour effectuer un don.
              </p>
            )}

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
              <span>🔐</span>
              <span>Paiement 100% sécurisé — Architecture Zero Trust — Zéro données bancaires stockées</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
