import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { recruitmentService } from '../../services/recruitment.service';

export const InboxPage: React.FC = () => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'requests'|'conversations'>('requests');
  const [loading, setLoading] = useState(true);

  // Chat variables
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const reqs = await recruitmentService.getRequests();
      setRequests(reqs);
      
      const convs = await recruitmentService.getConversations();
      setConversations(convs);
    } catch (e) {
      console.error("Failed to load inbox data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcceptRequest = async (id: string) => {
    try {
      await recruitmentService.acceptContactRequest(id);
      await loadData();
      setActiveTab('conversations');
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'acceptation.");
    }
  };

  const loadMessages = async (conv: any) => {
    setActiveConversation(conv);
    try {
      const msgs = await recruitmentService.getMessages(conv.id);
      setMessages(msgs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || !user) return;
    
    try {
      await recruitmentService.sendMessage(activeConversation.id, newMessage, user.id);
      setNewMessage('');
      await loadMessages(activeConversation);
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.detail || "Erreur d'envoi");
    }
  };

  if (loading) return <div className="p-8 text-white">Chargement de la boîte de réception...</div>;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-900 text-white">
      {/* Sidebar: Liste des conversations / requêtes */}
      <div className="w-1/3 border-r border-gray-800 flex flex-col bg-gray-950">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">Boîte de réception</h2>
        </div>
        
        <div className="flex border-b border-gray-800 text-sm font-medium">
          <button 
            className={`flex-1 py-3 ${activeTab === 'requests' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('requests')}
          >
            Demandes ({requests.filter(r => r.status === 'PENDING').length})
          </button>
          <button 
            className={`flex-1 py-3 ${activeTab === 'conversations' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('conversations')}
          >
            Conversations ({conversations.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'requests' && (
            <div className="p-2 space-y-2">
              {requests.length === 0 && <div className="text-gray-500 text-center p-4">Aucune demande.</div>}
              {requests.map(req => (
                <div key={req.id} className="p-4 bg-gray-900 rounded-lg border border-gray-800 hover:bg-gray-800 transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-blue-400">Demande de contact</span>
                      <p className="text-xs text-gray-500">Pour le talent: {req.talent?.name || 'Inconnu'}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${req.status === 'PENDING' ? 'bg-yellow-900 text-yellow-300' : 'bg-green-900 text-green-300'}`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mt-2 bg-gray-950 p-2 rounded italic">"{req.message}"</p>
                  
                  {req.status === 'PENDING' && (
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => handleAcceptRequest(req.id)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded">
                        Accepter
                      </button>
                      <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold py-2 rounded">
                        Refuser
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'conversations' && (
            <div className="p-2 space-y-1">
              {conversations.length === 0 && <div className="text-gray-500 text-center p-4">Aucune conversation active.</div>}
              {conversations.map(conv => (
                <button 
                  key={conv.id} 
                  onClick={() => loadMessages(conv)}
                  className={`w-full text-left p-4 rounded-lg flex items-center gap-3 transition ${activeConversation?.id === conv.id ? 'bg-blue-900 bg-opacity-30 border border-blue-800' : 'hover:bg-gray-800 border border-transparent'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-lg">
                    {conv.talent?.name?.[0]?.toUpperCase() || 'T'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-bold truncate text-sm">Discut. {conv.talent?.name}</h4>
                    <p className="text-xs text-gray-400 truncate">{conv.recruitment_stage}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="h-16 border-b border-gray-800 flex items-center px-6 justify-between bg-gray-950">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                  {activeConversation.talent?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold">Discussion: {activeConversation.talent?.name}</h3>
                  <p className="text-xs text-gray-400">Score de Risque: {activeConversation.risk_score} / 100</p>
                </div>
              </div>
              <div className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-300">
                {activeConversation.recruitment_stage}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <span className="text-4xl mb-2">👋</span>
                  <p>C'est le début de la conversation !</p>
                  <p className="text-xs mt-2 max-w-md text-center">Rappel : Tous les messages sont analysés par notre IA. L'échange de coordonnées directes est interdit pour la sécurité des talents mineurs.</p>
                </div>
              )}
              {messages.map(msg => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-100 rounded-bl-none'}`}>
                      <p className="text-sm">{msg.content}</p>
                      <span className="text-[10px] opacity-50 mt-1 block text-right">
                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-800 bg-gray-950">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message... (modéré par IA)"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-6 py-2 font-bold transition">
                  Envoyer
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-600">
            <span className="text-5xl mb-4">💬</span>
            <p className="text-lg">Sélectionnez une conversation pour commencer à discuter</p>
          </div>
        )}
      </div>
    </div>
  );
};
