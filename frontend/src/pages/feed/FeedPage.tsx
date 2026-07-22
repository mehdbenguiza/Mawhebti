import React, { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { videoService } from '../../services/video.service';
import { VideoFeedResponse } from '../../types/video';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';
import { recruitmentService } from '../../services/recruitment.service';

const VideoPlayer: React.FC<{ video: VideoFeedResponse; isActive: boolean }> = ({ video, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuthStore();
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [contactStatus, setContactStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Nouvelles intéractions
  const [likesCount, setLikesCount] = useState(video.likes_count);
  const [viewsCount, setViewsCount] = useState(video.views_count);
  const [isLiked, setIsLiked] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('contenu inapproprié');
  const [reportStatus, setReportStatus] = useState<'idle'|'loading'|'success'>('idle');
  const [shareToast, setShareToast] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.182.128:8000/api/v1';

  const getSessionId = () => {
    let sid = sessionStorage.getItem('mawhebti_session_id');
    if (!sid) {
      sid = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('mawhebti_session_id', sid);
    }
    return sid;
  };

  const handleContact = async () => {
    try {
      setContactStatus('loading');
      await recruitmentService.createContactRequest(video.creator.id, contactMessage || 'Bonjour, je souhaite entrer en contact concernant ce talent.');
      setContactStatus('success');
      setTimeout(() => setShowContactModal(false), 2000);
    } catch (e) {
      console.error(e);
      setContactStatus('error');
    }
  };

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(e => console.log('Auto-play prevented', e));
      
      // Fetch fresh stats when video becomes active
      videoService.getVideoStats(video.id).then(stats => {
        setLikesCount(stats.likes);
        setViewsCount(stats.views);
        setIsLiked(stats.liked);
      }).catch(e => console.error("Stats fetch error", e));

    } else if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive, video.id]);

  useEffect(() => {
    if (progress > 3 && !hasViewed) {
      setHasViewed(true);
      videoService.viewVideo(video.id, getSessionId(), Math.floor(progress), false)
        .then(res => setViewsCount(res.views_count))
        .catch(e => console.error("View track error", e));
    }
  }, [progress, hasViewed, video.id]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert("Veuillez vous connecter pour aimer cette vidéo.");
      return;
    }
    // Optimistic update
    const previousLiked = isLiked;
    const previousCount = likesCount;
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? Math.max(0, prev - 1) : prev + 1);
    
    try {
      const res = await videoService.likeVideo(video.id);
      // Le backend est la source de vérité
      setLikesCount(res.likes_count);
      setIsLiked(res.liked);
    } catch (e) {
      // Rollback sur erreur réseau
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      console.error('Like error:', e);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/feed?v=${video.id}`;
    
    // Méthode 1 : Web Share API (mobile natif)
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: `Découvrez ce talent sur Mawhebti : ${video.title}`,
          url,
        });
        return;
      } catch (e) {
        if ((e as Error).name !== 'AbortError') console.warn('Web Share failed, trying clipboard');
        else return; // L'utilisateur a annulé
      }
    }
    
    // Méthode 2 : Clipboard API (HTTPS)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(url);
        setShareToast(true);
        setTimeout(() => setShareToast(false), 3000);
        return;
      } catch (e) {
        console.warn('Clipboard API failed, trying execCommand');
      }
    }
    
    // Méthode 3 : execCommand (legacy, fonctionne sur HTTP)
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
      setShareToast(true);
      setTimeout(() => setShareToast(false), 3000);
    } catch (e) {
      // Méthode 4 : Modal manuelle
      setShareUrl(url);
      setShowShareModal(true);
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const handleReport = async () => {
    if (!user) {
      alert("Veuillez vous connecter pour signaler cette vidéo.");
      return;
    }
    try {
      setReportStatus('loading');
      await videoService.reportVideo(video.id, reportReason);
      setReportStatus('success');
      setTimeout(() => {
        setShowReportModal(false);
        setReportStatus('idle');
      }, 2000);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Erreur lors du signalement.";
      setReportStatus('idle');
      if (err?.response?.status === 409) {
        // Déjà signalé
        setReportStatus('already_reported' as any);
      } else {
        alert(msg);
      }
    }
  };

  const handleSaveTalent = async () => {
    if (!user || user.role !== 'RECRUITER') return;
    const previousSaved = isSaved;
    setIsSaved(!isSaved);
    try {
      const res = await recruitmentService.toggleSavedTalent(video.creator.id);
      setIsSaved(res.action === 'saved');
    } catch (e) {
      setIsSaved(previousSaved);
      console.error(e);
      alert("Erreur lors de la sauvegarde du talent.");
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const baseUrl = API_URL.replace('/api/v1', '');
  const cleanFilePath = video.file_path.startsWith('/') ? video.file_path.substring(1) : video.file_path;
  const videoUrl = video.file_path.startsWith('http') ? video.file_path : `${baseUrl}/${cleanFilePath}`;

  return (
    <div className="relative w-full h-full snap-start flex items-center justify-center bg-black sm:rounded-2xl overflow-hidden group">
      
      {/* Blurred background effect for desktop */}
      <div className="absolute inset-0 opacity-40 scale-110 hidden sm:block">
        <video src={videoUrl} className="w-full h-full object-cover blur-2xl" muted loop />
      </div>

      <video
        ref={videoRef}
        src={videoUrl}
        className="relative z-10 w-full h-full object-cover sm:object-contain sm:max-h-full cursor-pointer"
        loop
        playsInline
        muted={isMuted}
        onClick={togglePlay}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />

      {/* Top Controls: Volume */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-2 group/volume">
        {/* Volume Slider (appears on hover) */}
        <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 ease-out flex items-center bg-black/40 backdrop-blur-md rounded-full px-0 group-hover/volume:px-3 h-8">
          <input 
            type="range" 
            min="0" max="1" step="0.05" 
            value={isMuted ? 0 : volume} 
            onChange={(e) => {
              setVolume(Number(e.target.value));
              if (Number(e.target.value) > 0) setIsMuted(false);
              else setIsMuted(true);
            }}
            className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/60 transition-colors"
        >
          {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
        </button>
      </div>
      
      {/* Play/Pause indicator animation on click */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
      )}
      
      {/* Overlay: Bottom Left (Info) */}
      <div className="absolute bottom-10 left-4 right-20 text-white z-30 pointer-events-none" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
        <h3 className="text-lg font-bold flex items-center gap-1.5 mb-1.5">
          @{video.creator?.first_name || 'Talent'} {video.creator?.last_name || ''}
          {video.creator?.trust_level >= 1 && <span className="text-xs bg-teal-500/20 text-teal-400 px-1.5 py-0.5 rounded-full border border-teal-500/30 backdrop-blur-md">Vérifié ✓</span>}
        </h3>
        <p className="font-semibold text-sm leading-snug">{video.title}</p>
        {video.description && <p className="text-xs text-gray-200 mt-1 line-clamp-2">{video.description}</p>}
        
        {/* IA Tags */}
        {video.ai_tags && video.ai_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5 pointer-events-auto">
            <span className="bg-purple-600/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-lg">
              🤖 IA
            </span>
            {video.ai_tags.map((tag, idx) => (
              <span key={idx} className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] px-2 py-1 rounded-md hover:bg-white/20 transition-colors cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Overlay: Right Sidebar Actions (TikTok Style) */}
      <div className="absolute bottom-6 right-3 flex flex-col items-center gap-5 z-30">
        
        {/* Profile */}
        <div className="relative group/profile cursor-pointer">
          <div className="w-11 h-11 rounded-full border-2 border-white bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-lg shadow-lg">
            {(video.creator?.first_name?.[0] || 'T').toUpperCase()}
          </div>
          <button className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center border border-white shadow-sm hover:scale-110 transition-transform">
            +
          </button>
        </div>

        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1 mt-3 group/btn">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-sm group-hover/btn:bg-black/40 transition-colors">
            <span className={`text-2xl filter drop-shadow-lg transition-transform group-hover/btn:scale-110 ${isLiked ? 'text-red-500 scale-110' : 'text-white'}`}>
              {isLiked ? '❤️' : '🤍'}
            </span>
          </div>
          <span className="text-white text-[11px] font-bold drop-shadow-md">{likesCount}</span>
        </button>

        {/* Share */}
        <button onClick={handleShare} className="flex flex-col items-center gap-1 mt-2 group/btn">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-sm group-hover/btn:bg-black/40 transition-colors">
            <span className="text-2xl filter drop-shadow-lg transition-transform group-hover/btn:scale-110">↗️</span>
          </div>
          <span className="text-white text-[11px] font-bold drop-shadow-md">Partager</span>
        </button>
        
        {/* Views Display (Decorative in TikTok style, but useful here) */}
        <div className="flex flex-col items-center gap-1 mt-2">
          <span className="text-[10px] text-gray-300 font-semibold drop-shadow-md">👁️ {viewsCount}</span>
        </div>

        {/* Recruiter Actions */}
        {user?.role === 'RECRUITER' && (
          <>
            <button 
              onClick={handleSaveTalent} 
              className="flex flex-col items-center gap-1 group/btn mt-1"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-sm group-hover/btn:bg-black/40 transition-colors">
                <span className={`text-2xl filter drop-shadow-lg transition-transform group-hover/btn:scale-110 ${isSaved ? 'text-yellow-400 scale-110' : 'text-white'}`}>
                  {isSaved ? '⭐' : '☆'}
                </span>
              </div>
              <span className="text-[11px] font-bold drop-shadow-md text-white">{isSaved ? 'Sauvegardé' : 'Favoris'}</span>
            </button>
            
            <button 
              onClick={() => setShowContactModal(true)} 
              className="flex flex-col items-center gap-1 group/btn mt-2"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-teal-400 shadow-[0_0_15px_rgba(37,99,235,0.5)] group-hover/btn:scale-110 transition-transform">
                <span className="text-2xl">📩</span>
              </div>
              <span className="text-blue-400 text-[11px] font-black drop-shadow-md">Contacter</span>
            </button>
          </>
        )}

        {/* Report */}
        <button onClick={() => setShowReportModal(true)} className="flex flex-col items-center gap-1 mt-4 group/btn opacity-40 hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-sm text-sm">
            🚩
          </div>
        </button>
      </div>

      {/* Progress Bar (Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 z-40 group/progress cursor-pointer overflow-hidden sm:rounded-b-2xl">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-100 ease-linear"
          style={{ width: `${(progress / (duration || 1)) * 100}%` }}
        />
        <input 
          type="range" 
          min="0" max={duration || 100} step="0.1"
          value={progress}
          onChange={handleSeek}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#13131a] border border-white/10 rounded-2xl p-6 w-full max-w-sm text-white shadow-2xl">
            <h3 className="text-xl font-bold mb-4 font-display">Contacter {video.creator?.first_name}</h3>
            
            {contactStatus === 'success' ? (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-center text-sm">
                Demande de contact envoyée avec succès ! 🎉
              </div>
            ) : contactStatus === 'error' ? (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center text-sm">
                Erreur lors de l'envoi de la demande.
              </div>
            ) : (
              <>
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl mb-4">
                  <p className="text-xs text-yellow-200/80 leading-relaxed">
                    S'il s'agit d'un mineur, le message sera automatiquement transmis à son tuteur légal (Zero Trust).
                  </p>
                </div>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white mb-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-500 transition-all"
                  rows={4}
                  placeholder="Bonjour, je représente l'agence..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                />
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowContactModal(false)}
                    className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={handleContact}
                    disabled={contactStatus === 'loading'}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-sm font-bold rounded-xl shadow-lg disabled:opacity-50 transition-all"
                  >
                    {contactStatus === 'loading' ? 'Envoi...' : 'Envoyer 🚀'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#13131a] border border-white/10 rounded-2xl p-6 w-full max-w-sm text-white shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-red-500 font-display">Signaler la vidéo</h3>
            
            {reportStatus === 'success' ? (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-center">
                <div className="text-2xl mb-2">✅</div>
                <p className="text-sm font-semibold">Signalement reçu. Merci pour votre aide !</p>
              </div>
            ) : (reportStatus as string) === 'already_reported' ? (
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-4 rounded-xl text-center">
                <div className="text-2xl mb-2">⚠️</div>
                <p className="text-sm font-semibold">Vous avez déjà signalé cette vidéo.</p>
                <button onClick={() => { setShowReportModal(false); setReportStatus('idle'); }} className="mt-3 px-4 py-2 bg-white/10 rounded-lg text-xs font-semibold">Fermer</button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-300 mb-4">Pourquoi signalez-vous cette vidéo ?</p>
                <div className="flex flex-col gap-2 mb-6">
                  {['contenu inapproprié', 'spam', 'harcèlement', 'fausse identité', 'autre'].map(reason => (
                    <label key={reason} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      reportReason === reason
                        ? 'border-red-500/50 bg-red-500/10'
                        : 'border-white/10 hover:bg-white/5'
                    }`}>
                      <input 
                        type="radio" 
                        name="reportReason" 
                        value={reason} 
                        checked={reportReason === reason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="accent-red-500 w-4 h-4"
                      />
                      <span className="text-sm capitalize">{reason}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={handleReport}
                    disabled={reportStatus === 'loading'}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl shadow-lg disabled:opacity-50 transition-all"
                  >
                    {reportStatus === 'loading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        Envoi...
                      </span>
                    ) : 'Signaler 🚩'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Share Toast (copie réussie) */}
      {shareToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-green-500/90 backdrop-blur-md text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-xl border border-green-400/30 flex items-center gap-2 animate-bounce">
          ✅ Lien copié !
        </div>
      )}

      {/* Share Modal (fallback manuel) */}
      {showShareModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#13131a] border border-white/10 rounded-2xl p-6 w-full max-w-sm text-white shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Partager cette vidéo</h3>
            <p className="text-sm text-gray-400 mb-4">Copiez ce lien et partagez-le :</p>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-3">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent text-sm text-gray-200 outline-none"
                onFocus={(e) => e.target.select()}
              />
              <button
                onClick={() => {
                  const el = document.createElement('textarea');
                  el.value = shareUrl;
                  document.body.appendChild(el);
                  el.select();
                  document.execCommand('copy');
                  document.body.removeChild(el);
                  setShareToast(true);
                  setShowShareModal(false);
                  setTimeout(() => setShareToast(false), 3000);
                }}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Copier
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full mt-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold rounded-xl transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const FeedPage: React.FC = () => {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const { user } = useAuthStore();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam = 1 }) => videoService.getFeed(pageParam, 10, 'recent'),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const videos = data?.pages.flat() || [];

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const index = Math.round(container.scrollTop / container.clientHeight);
    if (index !== activeVideoIndex) setActiveVideoIndex(index);

    const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight * 2;
    if (isNearBottom && hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const container = document.getElementById('feed-container');
      if (!container) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        container.scrollBy({ top: container.clientHeight, behavior: 'smooth' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        container.scrollBy({ top: -container.clientHeight, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0a0a0f] text-white">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="Mawhebti" className="w-16 h-16 animate-pulse" />
          <p className="text-gray-400 font-medium">Chargement des talents...</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0a0a0f] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-violet-900/20 to-blue-900/20" />
        <div className="relative z-10 text-center">
          <div className="text-6xl mb-4">🎭</div>
          <h2 className="text-2xl font-black mb-2 font-display">Aucun talent pour le moment</h2>
          <p className="text-gray-400 mb-8 max-w-sm mx-auto">Revenez plus tard pour découvrir les nouvelles pépites tunisiennes.</p>
          <Link to="/" className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-semibold transition-all">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#0a0a0f] flex flex-col sm:flex-row overflow-hidden font-sans">
      
      {/* Desktop Sidebar (Optional, visible only on large screens to mimic TikTok web layout) */}
      <div className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-[#0a0a0f] p-4 flex-shrink-0 z-20">
        <Link to="/" className="flex items-center gap-2 mb-8 px-2 group">
          <img src="/logo.png" alt="Mawhebti" className="w-8 h-8 group-hover:scale-110 transition-transform" />
          <span className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-blue-500 font-display">
            Mawhebti
          </span>
        </Link>
        
        <nav className="space-y-2 flex-1">
          <Link to="/feed" className="flex items-center gap-3 px-3 py-2.5 text-white font-bold text-sm bg-white/10 rounded-xl border border-white/5">
            <span className="text-xl">🏠</span> Pour toi
          </Link>
          <Link to="/feed" className="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl text-sm font-semibold transition-colors">
            <span className="text-xl">👥</span> Abonnements
          </Link>
        </nav>
        
        <div className="pt-4 border-t border-white/5">
          {user ? (
            <Link to="/dashboard" className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {user.email[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                <p className="text-xs text-gray-400">Tableau de bord</p>
              </div>
            </Link>
          ) : (
            <Link to="/login" className="block w-full py-2.5 text-center bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 text-white font-bold text-sm rounded-xl shadow-lg transition-all">
              Connexion
            </Link>
          )}
        </div>
      </div>

      {/* Main Feed Area */}
      <div className="flex-1 flex justify-center items-center relative h-full bg-[#0a0a0f] sm:bg-[#111115]">
        
        {/* Mobile Header Overlay */}
        <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent lg:hidden pointer-events-none">
          <Link to="/" className="flex items-center gap-2 pointer-events-auto">
            <img src="/logo.png" alt="Mawhebti" className="w-7 h-7 drop-shadow-md" />
            <span className="text-white text-lg font-black tracking-tight font-display drop-shadow-md">Mawhebti</span>
          </Link>
          <Link to={user ? "/dashboard" : "/login"} className="pointer-events-auto">
            {user ? (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-lg border border-white/20">
                {user.email[0].toUpperCase()}
              </div>
            ) : (
              <span className="bg-white text-black px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">Connexion</span>
            )}
          </Link>
        </div>

        {/* Video Scroller Container */}
        <div 
          id="feed-container"
          className="h-full w-full sm:w-[400px] sm:h-[90%] md:w-[450px] lg:w-[400px] xl:w-[450px] relative bg-black sm:rounded-[2rem] sm:shadow-[0_0_50px_rgba(0,0,0,0.5)] sm:border sm:border-white/10 overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
          onScroll={handleScroll}
          style={{ scrollBehavior: 'smooth' }}
        >
          {videos.map((video, idx) => (
            <VideoPlayer 
              key={video.id} 
              video={video} 
              isActive={idx === activeVideoIndex} 
            />
          ))}

          {isFetchingNextPage && (
            <div className="h-20 w-full flex items-center justify-center text-white bg-black snap-start">
              <svg className="w-6 h-6 animate-spin text-white/50" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          )}
        </div>
        
        {/* Desktop Keyboard Hint */}
        <div className="hidden xl:flex absolute right-12 bottom-12 flex-col items-center gap-2 text-white/30 pointer-events-none">
          <div className="flex flex-col gap-1">
            <kbd className="w-10 h-10 border border-white/20 rounded-lg flex items-center justify-center font-sans text-xl shadow-sm bg-white/5">↑</kbd>
            <kbd className="w-10 h-10 border border-white/20 rounded-lg flex items-center justify-center font-sans text-xl shadow-sm bg-white/5">↓</kbd>
          </div>
          <span className="text-[10px] uppercase tracking-widest font-bold mt-2">Navigation</span>
        </div>

      </div>
    </div>
  );
};
