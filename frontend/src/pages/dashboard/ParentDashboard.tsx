import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parentService } from '../../services/parent.service';

export const ParentDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<{ id: string, action: 'approve' | 'reject' } | null>(null);
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: requests, isLoading } = useQuery({
    queryKey: ['parentRequests'],
    queryFn: parentService.getRequests
  });

  const handleMutation = useMutation({
    mutationFn: ({ id, action, pwd }: { id: string, action: 'approve' | 'reject', pwd: string }) => 
      parentService.handleRequest(id, action, pwd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parentRequests'] });
      setModalOpen(false);
      setPassword('');
      setSelectedRequest(null);
      setErrorMsg('');
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || "Erreur lors de la validation. Mot de passe incorrect ?");
    }
  });

  const openModal = (id: string, action: 'approve' | 'reject') => {
    setSelectedRequest({ id, action });
    setPassword('');
    setErrorMsg('');
    setModalOpen(true);
  };

  const confirmAction = () => {
    if (selectedRequest && password) {
      handleMutation.mutate({ 
        id: selectedRequest.id, 
        action: selectedRequest.action, 
        pwd: password 
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 text-white font-sans">
      <div>
        <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Espace Parent / Tuteur</h2>
        <p className="text-gray-400 mt-2 text-sm">Supervisez l'activité de votre enfant et gérez les autorisations.</p>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 flex items-start gap-4 shadow-lg">
        <span className="text-blue-400 text-2xl filter drop-shadow-md">ℹ️</span>
        <div>
          <p className="text-blue-400 font-bold text-sm">Rôle de tuteur légal</p>
          <p className="text-blue-200/70 text-sm mt-1 leading-relaxed">
            En tant que parent ou tuteur, vous êtes responsable de l'activité de votre enfant sur la plateforme.
            Votre consentement est requis pour certaines actions (publication de vidéos, candidatures à des missions).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <StatCard icon="🔔" label="Demandes en attente" value={requests?.length?.toString() || "0"} color="orange" />
      </div>

      <div className="bg-white/5 backdrop-blur-md rounded-2xl shadow-xl border border-white/10 p-6 sm:p-8 mt-8">
        <h3 className="font-bold text-xl text-white mb-6" style={{ fontFamily: "'Outfit', sans-serif" }}>Demandes de liaison d'enfants</h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin h-6 w-6 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          </div>
        ) : requests && requests.length > 0 ? (
          <ul className="space-y-4">
            {requests.map(req => (
              <li key={req.id} className="flex flex-col sm:flex-row items-center justify-between bg-white/5 p-5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="mb-4 sm:mb-0">
                  <p className="font-bold text-white text-sm">Demande d'un enfant (ID: {req.child_id.substring(0, 8)})</p>
                  <p className="text-xs text-gray-400 mt-1">Date: {new Date(req.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex space-x-3 w-full sm:w-auto">
                  <button 
                    className="flex-1 sm:flex-none px-4 py-2 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors text-sm font-semibold"
                    onClick={() => openModal(req.id, 'reject')}
                  >
                    Refuser
                  </button>
                  <button 
                    className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-lg shadow-lg hover:opacity-90 transition-opacity text-sm font-bold"
                    onClick={() => openModal(req.id, 'approve')}
                  >
                    Accepter
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 rounded-xl border border-dashed border-white/20 bg-white/5">
            <p className="text-sm text-gray-400 font-medium italic">Aucune demande en attente.</p>
          </div>
        )}
      </div>

      {/* Modal Mot de Passe */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#13131a] rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10">
            <h3 className="text-xl font-bold mb-2 text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Vérification de sécurité</h3>
            <p className="text-sm text-gray-400 mb-6">
              Pour <span className={selectedRequest?.action === 'approve' ? 'text-teal-400 font-bold' : 'text-red-400 font-bold'}>{selectedRequest?.action === 'approve' ? 'accepter' : 'refuser'}</span> cette demande, veuillez entrer votre mot de passe parent.
            </p>
            
            {errorMsg && <p className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-4">{errorMsg}</p>}
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-2">Mot de passe</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-white placeholder-gray-600 text-sm"
                placeholder="Votre mot de passe"
              />
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={confirmAction} 
                disabled={!password || handleMutation.isPending}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${selectedRequest?.action === 'approve' ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white' : 'bg-gradient-to-r from-red-600 to-orange-500 text-white'}`}
              >
                {handleMutation.isPending ? 'Chargement...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ icon: string; label: string; value: string; color: string }> = ({ icon, label, value, color }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  };
  const colorClass = colors[color] ?? 'bg-white/5 border-white/10 text-white';
  
  return (
    <div className={`rounded-2xl border p-6 flex flex-col justify-center shadow-lg transition-transform hover:-translate-y-1 ${colorClass}`}>
      <div className="flex items-center gap-4 mb-2">
        <div className="text-3xl filter drop-shadow-md">{icon}</div>
        <p className="text-3xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>{value}</p>
      </div>
      <p className="text-sm font-semibold opacity-80 uppercase tracking-wider">{label}</p>
    </div>
  );
};
