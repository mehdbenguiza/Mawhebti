import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SecurityIcon from '@mui/icons-material/Security';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import api from '../../services/api';

export function CampaignCheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDonate = async () => {
    const finalAmount = customAmount ? parseFloat(customAmount) : amount;
    
    if (!finalAmount || finalAmount < 10) {
      setError("Le montant minimum est de 10 euros");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post(`/campaigns/${id}/donate`, {
        amount: finalAmount,
        currency: 'EUR'
      });
      
      if (response.data && response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        throw new Error("Erreur d'initialisation du paiement");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur de paiement");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
          
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-purple-500/20 rounded-full">
              <FavoriteIcon className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-white text-center mb-2">Faire un don</h1>
          <p className="text-gray-400 text-center mb-8">
            Soutenez ce talent dans la réalisation de son objectif.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[20, 50, 100].map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setAmount(preset);
                  setCustomAmount('');
                }}
                className={`py-3 rounded-xl font-medium transition-colors ${
                  amount === preset && !customAmount
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {preset} €
              </button>
            ))}
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-400">€</span>
            </div>
            <input
              type="number"
              placeholder="Montant libre (min. 10€)"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                if (e.target.value) setAmount(0);
              }}
              className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
            />
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3 text-red-400">
              <ErrorOutlineIcon className="w-5 h-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleDonate}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 rounded-xl text-white font-bold text-lg transition-opacity flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CreditCardIcon className="w-5 h-5" />
                <span>Payer {(customAmount ? parseFloat(customAmount) : amount) || 0} €</span>
              </>
            )}
          </button>

          <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-gray-500">
            <SecurityIcon className="w-4 h-4 text-green-500" />
            <span>Paiement 100% sécurisé via Stripe Webhooks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
