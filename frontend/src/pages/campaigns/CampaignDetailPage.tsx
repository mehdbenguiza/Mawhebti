import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

function getTimeLeft(endDate: string): string {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return 'Terminée';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}j ${hours}h`;
  return `${hours}h ${minutes}m`;
}

export const CampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('description');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Fraude');
  const [reportDesc, setReportDesc] = useState('');
  const [commentText, setCommentText] = useState('');

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const { data } = await api.get(`/campaigns/${id}`);
      return data;
    },
    enabled: !!id
  });

  const { data: donors } = useQuery({
    queryKey: ['campaign-donors', id],
    queryFn: async () => {
      const { data } = await api.get(`/campaigns/${id}/donors?page=1`);
      return data;
    },
    enabled: activeTab === 'donors' && !!id
  });

  const { data: comments } = useQuery({
    queryKey: ['campaign-comments', id],
    queryFn: async () => {
      const { data } = await api.get(`/campaigns/${id}/comments?page=1`);
      return data;
    },
    enabled: (activeTab === 'comments' || activeTab === 'news') && !!id
  });

  const [isFavorited, setIsFavorited] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [postingNews, setPostingNews] = useState(false);

  const handleFavorite = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      await api.post(`/campaigns/${id}/favorite`);
      setIsFavorited(f => !f);
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Erreur.');
    }
  };

  const handlePostNews = async () => {
    if (!newPost.trim()) return;
    setPostingNews(true);
    try {
      await api.post(`/campaigns/${id}/comment`, { content: `📢 **ACTUALITÉ** — ${newPost}` });
      setNewPost('');
      queryClient.invalidateQueries({ queryKey: ['campaign-comments', id] });
    } finally {
      setPostingNews(false);
    }
  };

  const postCommentMutation = useMutation({
    mutationFn: (content: string) => api.post(`/campaigns/${id}/comment`, { content }),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['campaign-comments', id] });
    }
  });

  const reportMutation = useMutation({
    mutationFn: () => api.post(`/campaigns/${id}/report`, { reason: reportReason, description: reportDesc }),
    onSuccess: () => {
      setShowReportModal(false);
      alert('Signalement envoyé avec succès.');
    }
  });

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    alert('✅ Lien copié !');
  };

  const handlePublish = async () => {
    try {
      await api.post(`/campaigns/${id}/publish`);
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      alert('✅ Campagne soumise pour révision !');
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Erreur lors de la soumission.');
    }
  };

  const handlePause = async () => {
    try {
      await api.post(`/campaigns/${id}/pause`);
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      alert('⏸ Campagne mise en pause.');
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Erreur.');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Confirmer l’annulation de cette campagne ?')) return;
    try {
      await api.post(`/campaigns/${id}/cancel`);
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      alert('Campagne annulée.');
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Erreur.');
    }
  };

  const handleGetInviteLink = async () => {
    try {
      const { data } = await api.get(`/campaigns/${id}/invite-link`);
      const url = `${window.location.origin}/campaigns/join/${data.invite_code}`;
      await navigator.clipboard.writeText(url);
      alert(`✅ Lien privé copié !\n\n${url}`);
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Impossible de récupérer le lien.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl backdrop-blur-md">
          Campagne introuvable.
        </div>
      </div>
    );
  }

  const isCreator = user && campaign.creator_id === user.id;
  const current = campaign.current_amount ?? campaign.amount_collected ?? 0;
  const target = campaign.target_amount ?? campaign.goal_amount ?? 1;
  const progress = Math.min((current / target) * 100, 100);
  const dashboardPath = user
    ? `/dashboard/${user.role === 'TALENT_MINOR' || user.role === 'TALENT_MAJOR' ? 'talent' : user.role === 'PARENT' ? 'parent' : 'recruiter'}/overview`
    : '/login';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans pb-20">

      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            ← Retour
          </button>
          <span className="text-white font-bold text-sm truncate max-w-[200px]" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {campaign.title}
          </span>
          <Link to={dashboardPath} className="text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors">
            {user ? 'Mon Dashboard →' : 'Se connecter'}
          </Link>
        </div>
      </nav>

      {/* HEADER SECTION */}
      <div className="bg-white/5 border-b border-white/10 pt-8 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Left: Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="bg-violet-500/20 text-violet-300 px-3 py-1 rounded-full border border-violet-500/30">
                  {campaign.category}
                </span>
                <span>📍 {campaign.location}</span>
                <span>👤 Par {campaign.creator_name || 'Inconnu'}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {campaign.title}
              </h1>
              
              {/* Progress */}
              <div className="bg-black/30 rounded-2xl p-6 border border-white/5 mt-6">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <span className="text-2xl font-black text-white">{current.toLocaleString('fr-TN')} TND</span>
                    <span className="text-gray-500 text-sm">sur {target.toLocaleString('fr-TN')} TND</span>
                  </div>
                  <span className="text-xl font-bold text-violet-400">{progress.toFixed(1)}%</span>
                </div>
                <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-600 to-blue-600 rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <div className="grid grid-cols-4 gap-4 mt-6 text-center">
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="text-xl font-bold">{campaign.views_count ?? 0}</div>
                    <div className="text-xs text-gray-400">Vues 👁️</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="text-xl font-bold">{campaign.donors_count ?? 0}</div>
                    <div className="text-xs text-gray-400">Dons 👥</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="text-xl font-bold">{campaign.favorites_count ?? 0}</div>
                    <div className="text-xs text-gray-400">Favoris ❤️</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="text-xl font-bold">{getTimeLeft(campaign.end_date)}</div>
                    <div className="text-xs text-gray-400">Restant ⏳</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="w-full lg:w-80 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 flex flex-col gap-4 shadow-xl">
              {isCreator ? (
                <>
                  <div className="text-center font-bold text-violet-400 mb-2">⚙️ Gestion créateur</div>

                  {/* Statut actuel */}
                  <div className="text-center text-xs py-2 px-3 rounded-xl border border-white/10 bg-white/5 text-gray-400">
                    Statut : <span className="font-bold text-white">
                      {campaign.status === 'DRAFT' ? '📝 Brouillon'
                        : campaign.status === 'PENDING_REVIEW' ? '🕐 En révision'
                        : campaign.status === 'ACTIVE' ? '✅ Active'
                        : campaign.status === 'PAUSED' ? '⏸ Pause'
                        : campaign.status === 'REJECTED' ? '❌ Refusée'
                        : campaign.status}
                    </span>
                  </div>

                  {/* Soumettre : seulement si DRAFT ou REJECTED */}
                  {(campaign.status === 'DRAFT' || campaign.status === 'REJECTED') && (
                    <button
                      onClick={handlePublish}
                      className="w-full py-3 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl font-bold text-white hover:opacity-90 transition-opacity"
                    >
                      📤 Soumettre pour révision
                    </button>
                  )}

                  {/* Modifier : DRAFT, REJECTED, ou ACTIVE (titre/description/catégorie) */}
                  {(campaign.status === 'DRAFT' || campaign.status === 'REJECTED' || campaign.status === 'ACTIVE') && (
                    <button
                      onClick={() => navigate(`/campaigns/${id}/edit`)}
                      className="w-full py-3 bg-white/10 rounded-xl font-bold text-white hover:bg-white/20 transition-colors"
                    >
                      ✏️ Modifier
                      {campaign.status === 'ACTIVE' && <span className="text-[10px] block text-gray-400">(titre/description/catégorie)</span>}
                    </button>
                  )}

                  {/* Pause : seulement si ACTIVE */}
                  {campaign.status === 'ACTIVE' && (
                    <button
                      onClick={handlePause}
                      className="w-full py-3 bg-orange-500/20 text-orange-400 rounded-xl font-bold border border-orange-500/30 hover:bg-orange-500/30 transition-colors"
                    >
                      ⏸️ Mettre en pause
                    </button>
                  )}

                  {/* Lien privé : si PRIVATE ou UNLISTED */}
                  {(campaign.visibility === 'PRIVATE' || campaign.visibility === 'UNLISTED') && (
                    <button
                      onClick={handleGetInviteLink}
                      className="w-full py-3 bg-purple-500/20 text-purple-300 rounded-xl font-bold border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
                    >
                      🔗 Copier le lien privé
                    </button>
                  )}

                  {/* Annuler */}
                  {!['COMPLETED', 'EXPIRED', 'CANCELLED'].includes(campaign.status) && (
                    <button
                      onClick={handleCancel}
                      className="w-full py-3 bg-red-500/20 text-red-400 rounded-xl font-bold border border-red-500/30 hover:bg-red-500/30 transition-colors"
                    >
                      ❌ Annuler la campagne
                    </button>
                  )}

                  {/* Partager */}
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="w-full py-3 bg-white/10 rounded-xl font-bold text-white hover:bg-white/20 transition-colors"
                  >
                    📤 Partager
                  </button>

                  {/* Note statut */}
                  {campaign.status === 'PENDING_REVIEW' && (
                    <p className="text-[10px] text-yellow-400/80 text-center">
                      ⏳ En attente d'approbation admin.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <button onClick={() => navigate(`/campaigns/${id}/donate`)} className="w-full py-4 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl font-bold text-lg text-white hover:opacity-90 shadow-lg hover:shadow-violet-500/25 transition-all">
                    💰 Soutenir ce projet
                  </button>
                  <div className="flex gap-2">
                    <button
                    onClick={handleFavorite}
                    className={`flex-1 py-3 rounded-xl font-bold transition-colors border ${
                      isFavorited
                        ? 'bg-red-500/30 text-red-300 border-red-500/40'
                        : 'bg-white/10 text-white border-white/10 hover:bg-red-500/20 hover:text-red-300'
                    }`}
                  >
                    {isFavorited ? '❤️ Favori' : '🤍 Favori'}
                  </button>
                  <button onClick={() => setShowShareModal(true)} className="flex-1 py-3 bg-white/10 rounded-xl font-bold text-white hover:bg-white/20 transition-colors border border-white/10">
                    📤 Partager
                  </button>
                  </div>
                  <button onClick={() => setShowReportModal(true)} className="text-sm text-gray-500 hover:text-red-400 mt-2 transition-colors">
                    🚩 Signaler cette campagne
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex gap-6 border-b border-white/10 mb-8 overflow-x-auto">
          {['description', 'donors', 'comments', 'news'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 font-bold text-sm whitespace-nowrap transition-colors ${
                activeTab === tab ? 'text-violet-400 border-b-2 border-violet-500' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'description' && '📝 Description'}
              {tab === 'donors' && '🤝 Donateurs'}
              {tab === 'comments' && '💬 Commentaires'}
              {tab === 'news' && '📰 Actualités'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[400px]">
          
          {activeTab === 'description' && (
            <div className="space-y-6">
              {campaign.video_url && (
                <div className="rounded-xl overflow-hidden bg-black aspect-video mb-8">
                  <video src={campaign.video_url} controls className="w-full h-full object-cover" />
                </div>
              )}
              <div className="prose prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-gray-300 leading-relaxed text-lg">
                  {campaign.description || "Aucune description fournie pour cette campagne."}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'donors' && (
            <div className="space-y-4">
              {!donors?.items?.length ? (
                <p className="text-center text-gray-400 py-12">Aucun don pour le moment. Soyez le premier !</p>
              ) : (
                donors.items.map((donor: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-violet-600/30 flex items-center justify-center text-xl">
                        {donor.is_anonymous ? '👤' : '✨'}
                      </div>
                      <div>
                        <div className="font-bold text-white">{donor.is_anonymous ? 'Anonyme' : donor.name}</div>
                        {donor.message && <div className="text-sm text-gray-400 italic">"{donor.message}"</div>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-violet-400">{donor.amount.toLocaleString('fr-TN')} TND</div>
                      <div className="text-xs text-gray-500">{new Date(donor.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-8">
              {user ? (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600/30 flex items-center justify-center shrink-0">
                    {user.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 space-y-2">
                    <textarea 
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder="Ajouter un commentaire..."
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-violet-500 resize-none h-24"
                    />
                    <div className="flex justify-end">
                      <button 
                        onClick={() => postCommentMutation.mutate(commentText)}
                        disabled={!commentText.trim() || postCommentMutation.isPending}
                        className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg disabled:opacity-50 transition-colors"
                      >
                        Publier
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 bg-black/20 rounded-xl border border-white/5">
                  <p className="text-gray-400 mb-4">Connectez-vous pour participer à la discussion.</p>
                  <Link to={`/login?redirect=/campaigns/${id}`} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-colors">
                    Se connecter
                  </Link>
                </div>
              )}

              <div className="space-y-4">
                {!comments?.items?.length ? (
                  <p className="text-center text-gray-400 py-8">Aucun commentaire.</p>
                ) : (
                  comments.items.map((comment: any, i: number) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                        {comment.author_name?.[0] || 'U'}
                      </div>
                      <div className="flex-1 bg-black/20 p-4 rounded-xl border border-white/5">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-white">{comment.author_name}</span>
                          <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-300">{comment.content}</p>
                        <button className="text-xs font-bold text-gray-400 hover:text-white mt-3">Répondre</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'news' && (
            <div className="space-y-6">
              {/* Formulaire créateur */}
              {isCreator && (
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-violet-300 mb-3">📢 Publier une actualité</h3>
                  <textarea
                    value={newPost}
                    onChange={e => setNewPost(e.target.value)}
                    placeholder="Partagez une mise à jour avec vos donateurs (ex: avancement du projet, remerciements, nouvelles importantes)..."
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-violet-500 resize-none h-28"
                  />
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-gray-500">{newPost.length}/500 caractères</span>
                    <button
                      onClick={handlePostNews}
                      disabled={!newPost.trim() || postingNews || newPost.length > 500}
                      className="px-5 py-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-opacity"
                    >
                      {postingNews ? 'Publication...' : '📢 Publier'}
                    </button>
                  </div>
                </div>
              )}

              {/* Liste des actualités (commentaires du créateur marqués 📢) */}
              <div className="space-y-4">
                {!comments?.items?.length ? (
                  <div className="text-center py-12">
                    <span className="text-4xl block mb-3">📰</span>
                    <p className="text-gray-400 text-sm">Aucune actualité publiée.</p>
                    {isCreator && <p className="text-xs text-gray-500 mt-2">Publiez votre première mise à jour ci-dessus.</p>}
                  </div>
                ) : (
                  comments.items
                    .filter((c: any) => c.content?.startsWith('📢 **ACTUALITÉ**'))
                    .map((post: any, i: number) => (
                      <div key={i} className="bg-black/20 border border-violet-500/20 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 rounded-full bg-violet-600/40 flex items-center justify-center text-sm font-bold">
                            {post.author_name?.[0] || '🎤'}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-violet-300">{post.author_name || 'Créateur'} <span className="text-[10px] bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full ml-1">CRÉATEUR</span></div>
                            <div className="text-[10px] text-gray-500">{new Date(post.created_at).toLocaleDateString('fr-TN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                          </div>
                        </div>
                        <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                          {post.content.replace('📢 **ACTUALITÉ** — ', '')}
                        </p>
                      </div>
                    ))
                )}
                {comments?.items?.filter((c: any) => c.content?.startsWith('📢 **ACTUALITÉ**')).length === 0 && comments?.items?.length > 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">Aucune actualité publiée par le créateur.</p>
                  </div>
                )}
              </div>
            </div>
          )}


        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#13131a] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Partager la campagne</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase">Lien public</label>
                <div className="flex mt-1">
                  <input readOnly value={window.location.href} className="flex-1 bg-black/40 border border-white/10 rounded-l-xl p-3 text-sm text-gray-300" />
                  <button onClick={() => copyToClipboard(window.location.href)} className="px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-r-xl font-bold">Copier</button>
                </div>
              </div>
              {isCreator && (campaign.visibility === 'PRIVATE' || campaign.visibility === 'UNLISTED') && (
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase">🔒 Lien d'invitation privé</label>
                  <div className="flex mt-2">
                    <input
                      readOnly
                      value={`${window.location.origin}/campaigns/join/[cliquez Copier lien]`}
                      className="flex-1 bg-black/40 border border-white/10 rounded-l-xl p-3 text-sm text-orange-300 truncate"
                    />
                    <button
                      onClick={handleGetInviteLink}
                      className="px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-r-xl font-bold whitespace-nowrap"
                    >
                      Copier lien
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Cliquez 'Copier lien' pour générer et copier le lien privé.</p>
                </div>
              )}
            </div>
            <button onClick={() => setShowShareModal(false)} className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors">Fermer</button>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#13131a] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Signaler la campagne</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 font-bold mb-1 block">Motif</label>
                <select value={reportReason} onChange={e => setReportReason(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-red-500">
                  <option value="Fraude">Fraude financière</option>
                  <option value="Contenu inapproprié">Contenu inapproprié</option>
                  <option value="Projet inexistant">Projet inexistant / Faux projet</option>
                  <option value="Spam">Spam</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-300 font-bold mb-1 block">Détails (optionnel)</label>
                <textarea 
                  value={reportDesc} 
                  onChange={e => setReportDesc(e.target.value)} 
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-red-500 resize-none h-24"
                  placeholder="Expliquez brièvement le problème..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowReportModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors border border-white/10">Annuler</button>
              <button onClick={() => reportMutation.mutate()} disabled={reportMutation.isPending} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50">
                Signaler
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
