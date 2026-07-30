import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export const ReceiptsPage: React.FC = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['receipts'],
    queryFn: async () => { const { data } = await api.get('/payments/receipts'); return data; }
  });

  const receipts: any[] = data?.items || [];

  const handleDownload = async (receiptId: string, receiptNumber: string) => {
    // Créer un reçu en HTML et l'imprimer
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.write(`
        <!DOCTYPE html><html>
        <head>
          <title>Reçu ${receiptNumber} — Mawhebti</title>
          <style>
            body { font-family: 'Arial', sans-serif; max-width: 600px; margin: 40px auto; color: #1f2937; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #7c3aed; padding-bottom: 20px; }
            .logo { font-size: 2em; font-weight: 900; color: #7c3aed; }
            .receipt-number { font-size: 0.9em; color: #6b7280; margin-top: 4px; }
            .section { margin: 20px 0; }
            .label { color: #6b7280; font-size: 0.85em; }
            .value { font-weight: bold; font-size: 1em; }
            .amount { font-size: 2em; font-weight: 900; color: #7c3aed; text-align: center; margin: 30px 0; }
            .footer { text-align: center; color: #9ca3af; font-size: 0.8em; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">💜 Mawhebti</div>
            <div class="receipt-number">Reçu de don — ${receiptNumber}</div>
          </div>
          <div class="amount">🎉 Don confirmé</div>
          <div class="section"><span class="label">Numéro de reçu : </span><span class="value">${receiptNumber}</span></div>
          <div class="section"><span class="label">Date : </span><span class="value">${new Date().toLocaleDateString('fr-TN', { day: '2-digit', month: 'long', year: 'numeric' })}</span></div>
          <div class="section"><span class="label">Devise : </span><span class="value">Dinar Tunisien (TND)</span></div>
          <div class="footer">
            <p>Merci pour votre soutien aux talents tunisiens.</p>
            <p>Ce document est un reçu officiel de votre don sur la plateforme Mawhebti.</p>
            <p>© ${new Date().getFullYear()} Mawhebti — Tous droits réservés.</p>
          </div>
        </body></html>
      `);
      printWindow.document.close();
      printWindow.print();
    } catch { /* noop */ }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans pb-16">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white text-sm">← Retour</button>
          <span className="font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>🧾 Mes Reçus</span>
          <button onClick={() => navigate('/wallet/donations')} className="text-xs text-violet-400 hover:text-violet-300">Mes dons →</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
            🧾 Reçus de dons
          </h2>
          <span className="text-xs text-gray-500">{receipts.length} reçu{receipts.length > 1 ? 's' : ''}</span>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
          <p className="text-xs text-blue-300">ℹ️ Un reçu est généré automatiquement après chaque don réussi. Vous pouvez les télécharger ou les imprimer.</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}</div>
        ) : !receipts.length ? (
          <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
            <span className="text-5xl block mb-3">🧾</span>
            <p className="text-gray-400 text-sm">Aucun reçu disponible.</p>
            <p className="text-gray-600 text-xs mt-1">Effectuez un don pour recevoir votre reçu.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {receipts.map((r: any) => (
              <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between hover:bg-white/8 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-violet-500/20 border border-violet-500/30 rounded-xl flex items-center justify-center text-xl">🧾</div>
                  <div>
                    <div className="font-black text-white text-sm">{r.receipt_number}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Généré le {new Date(r.generated_at).toLocaleDateString('fr-TN', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(r.id, r.receipt_number)}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600/20 border border-violet-500/30 rounded-xl text-violet-300 text-xs font-bold hover:bg-violet-600/30 transition-colors"
                >
                  📥 Télécharger
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
