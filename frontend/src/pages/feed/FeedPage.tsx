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
  const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.182.128:8000/api/v1';

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
      videoRef.current.play().catch(e => console.log('Auto-play prevented', e));
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [isActive]);

  // Construct absolute URL for the video
  const baseUrl = API_URL.replace('/api/v1', '');
  const cleanFilePath = video.file_path.startsWith('/') ? video.file_path.substring(1) : video.file_path;
  const videoUrl = video.file_path.startsWith('http') 
    ? video.file_path 
    : `${baseUrl}/${cleanFilePath}`;

  return (
    <div className="relative w-full h-screen snap-start bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        loop
        playsInline
        muted={true} // Obligatoire pour l'autoplay sur la plupart des navigateurs
        controls={true} // On ajoute les contrôles pour l'instant pour débugger et le son
        onClick={(e) => {
          // Si on a les contrôles natifs, le onClick manuel n'est plus indispensable,
          // mais on le garde pour faire play/pause en tapant l'écran.
          e.preventDefault();
          if (videoRef.current?.paused) videoRef.current.play();
          else videoRef.current?.pause();
        }}
      />
      
      {/* Overlay: Bottom Left */}
      <div className="absolute bottom-20 left-4 right-16 text-white z-10 pointer-events-none">
        <h3 className="text-xl font-bold flex items-center gap-2">
          @{video.creator?.first_name || 'Talent'} {video.creator?.last_name || ''}
          {video.creator?.trust_level >= 1 && <span title="Profil Vérifié">🟢</span>}
          {video.creator?.trust_level >= 2 && <span title="Identité Validée">🔵</span>}
        </h3>
        <p className="font-semibold text-lg mt-1">{video.title}</p>
        {video.description && <p className="text-sm line-clamp-2 text-gray-200 mt-1">{video.description}</p>}
        
        {/* Tags IA */}
        {video.ai_tags && video.ai_tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pointer-events-auto">
            <span className="bg-purple-600 bg-opacity-80 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
              🟣 IA Analysée
            </span>
            {video.ai_tags.map((tag, idx) => (
              <span key={idx} className="bg-white bg-opacity-20 backdrop-blur-sm border border-white/30 text-white text-xs px-2 py-1 rounded-md">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Overlay: Right Sidebar Actions */}
      <div className="absolute bottom-20 right-4 flex flex-col items-center gap-6 z-10">
        <button className="flex flex-col items-center gap-1 transition transform hover:scale-110">
          <div className="bg-gray-800 bg-opacity-50 p-3 rounded-full border border-gray-600 text-white text-xl">
            👤
          </div>
          <span className="text-white text-xs font-medium shadow-sm">Profil</span>
        </button>

        <button className="flex flex-col items-center gap-1 transition transform hover:scale-110">
          <div className="bg-gray-800 bg-opacity-50 p-3 rounded-full border border-gray-600 text-white text-xl">
            ❤️
          </div>
          <span className="text-white text-xs font-medium shadow-sm">{video.likes_count}</span>
        </button>

        <button className="flex flex-col items-center gap-1 transition transform hover:scale-110">
          <div className="bg-gray-800 bg-opacity-50 p-3 rounded-full border border-gray-600 text-white text-xl">
            🎁
          </div>
          <span className="text-white text-xs font-medium shadow-sm">Soutenir</span>
        </button>

        {user?.role === 'RECRUITER' && (
          <button onClick={() => setShowContactModal(true)} className="flex flex-col items-center gap-1 transition transform hover:scale-110">
            <div className="bg-blue-600 p-3 rounded-full text-white text-xl shadow-lg">
              📩
            </div>
            <span className="text-white text-xs font-medium shadow-sm">Contacter</span>
          </button>
        )}
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="absolute inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-sm text-white">
            <h3 className="text-xl font-bold mb-4">Contacter {video.creator?.first_name}</h3>
            
            {contactStatus === 'success' ? (
              <div className="text-green-400 text-center py-4">Demande de contact envoyée avec succès ! 🎉</div>
            ) : contactStatus === 'error' ? (
              <div className="text-red-400 text-center py-4">Erreur lors de l'envoi de la demande. Vous avez peut-être déjà une demande en cours.</div>
            ) : (
              <>
                <p className="text-sm text-gray-400 mb-4">
                  En tant que recruteur vérifié, vous pouvez envoyer une demande de contact.
                  S'il s'agit d'un mineur, le message sera automatiquement transmis à son parent/tuteur légal (Zero Trust).
                </p>
                <textarea 
                  className="w-full bg-gray-800 border border-gray-600 rounded-md p-3 text-white mb-4 focus:outline-none focus:border-blue-500"
                  rows={4}
                  placeholder="Bonjour, je représente..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                />
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowContactModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={handleContact}
                    disabled={contactStatus === 'loading'}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50"
                  >
                    {contactStatus === 'loading' ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const FeedPage: React.FC = () => {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam = 1 }) => videoService.getFeed(pageParam, 10, 'recent'),
    getNextPageParam: (lastPage, allPages) => {
      // If the last page returned fewer than 10 items, we're at the end
      return lastPage.length === 10 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const videos = data?.pages.flat() || [];

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    // Calculate which video is currently mostly in view
    // Since each video is exactly the height of the container, index is scrollTop / clientHeight
    const index = Math.round(container.scrollTop / container.clientHeight);
    if (index !== activeVideoIndex) {
      setActiveVideoIndex(index);
    }

    // Trigger fetch next page if we are near the bottom
    const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight * 2;
    if (isNearBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-black text-white">Chargement du fil d'actualité...</div>;
  }

  if (videos.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white">
        <h2 className="text-2xl font-bold mb-4">Oups !</h2>
        <p className="text-gray-400 mb-8">Aucune vidéo n'a encore été publiée.</p>
        <Link to="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-md">Retour au Dashboard</Link>
      </div>
    );
  }

  return (
    <div 
      className="h-screen w-full sm:max-w-md mx-auto bg-black overflow-y-scroll snap-y snap-mandatory hide-scrollbar relative"
      onScroll={handleScroll}
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between p-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <h1 className="text-white text-xl font-bold tracking-wider">Mawhebti</h1>
        <Link to="/dashboard" className="text-white font-medium text-sm pointer-events-auto hover:underline">
          Menu
        </Link>
      </div>

      {videos.map((video, idx) => (
        <VideoPlayer 
          key={video.id} 
          video={video} 
          isActive={idx === activeVideoIndex} 
        />
      ))}

      {isFetchingNextPage && (
        <div className="h-20 w-full flex items-center justify-center text-white bg-black snap-start">
          Chargement...
        </div>
      )}
    </div>
  );
};
