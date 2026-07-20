import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parentService, ParentChildLinkResponse } from '../../services/parent.service';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Espace Parent / Tuteur</h2>
        <p className="text-gray-600 mt-1">Supervisez l'activité de votre enfant et gérez les autorisations.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <span className="text-blue-600 text-xl">ℹ️</span>
        <div>
          <p className="text-blue-800 font-medium text-sm">Rôle de tuteur légal</p>
          <p className="text-blue-700 text-sm mt-1">
            En tant que parent ou tuteur, vous êtes responsable de l'activité de votre enfant sur la plateforme.
            Votre consentement est requis pour certaines actions (publication de vidéos, candidatures à des missions).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard icon="🔔" label="Demandes en attente" value={requests?.length?.toString() || "0"} color="orange" />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Demandes de liaison d'enfants</h3>
        
        {isLoading ? (
          <p className="text-sm text-gray-500">Chargement...</p>
        ) : requests && requests.length > 0 ? (
          <ul className="space-y-4">
            {requests.map(req => (
              <li key={req.id} className="flex flex-col sm:flex-row items-center justify-between bg-gray-50 p-4 rounded-md border">
                <div className="mb-4 sm:mb-0">
                  <p className="font-medium text-gray-900">Demande d'un enfant (ID: {req.child_id.substring(0, 8)})</p>
                  <p className="text-sm text-gray-500">Date: {new Date(req.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex space-x-3">
                  <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => openModal(req.id, 'reject')}>
                    Refuser
                  </Button>
                  <Button onClick={() => openModal(req.id, 'approve')}>
                    Accepter
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 italic">Aucune demande en attente.</p>
        )}
      </div>

      {/* Modal Mot de Passe */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold mb-2">Vérification de sécurité</h3>
            <p className="text-sm text-gray-600 mb-4">
              Pour {selectedRequest?.action === 'approve' ? 'accepter' : 'refuser'} cette demande, veuillez entrer votre mot de passe parent.
            </p>
            
            {errorMsg && <p className="text-red-500 text-sm mb-3">{errorMsg}</p>}
            
            <Input 
              type="password" 
              label="Mot de passe" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
            />
            
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
              <Button 
                onClick={confirmAction} 
                isLoading={handleMutation.isPending}
                disabled={!password}
              >
                Confirmer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ icon: string; label: string; value: string; color: string }> = ({ icon, label, value, color }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100',
    orange: 'bg-orange-50 border-orange-100',
  };
  return (
    <div className={`rounded-lg border p-5 ${colors[color] ?? 'bg-gray-50 border-gray-100'}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
};
