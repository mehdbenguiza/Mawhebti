import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { videoService } from '../../services/video.service';

export const TalentDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isMinor = user?.role === 'TALENT_MINOR';

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['my-videos'],
    queryFn: videoService.getMyVideos,
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 text-white font-sans">
      <div>
        <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Mon espace Talent</h2>
        <p className="text-gray-400 mt-2 text-sm">
          {isMinor
            ? 'Espace protégé - Votre activité est supervisée par votre parent/tuteur.'
            : 'Gérez votre profil, vos vidéos et vos candidatures.'}
        </p>
      </div>

      {isMinor && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-5 flex items-start gap-4 shadow-lg">
          <span className="text-yellow-400 text-2xl filter drop-shadow-md">⚠️</span>
          <div>
            <p className="text-yellow-400 font-bold text-sm">Compte Mineur</p>
            <p className="text-yellow-200/70 text-sm mt-1 leading-relaxed">
              Certaines fonctionnalités sont réservées aux majeurs ou nécessitent le consentement de votre tuteur légal.
            </p>
          </div>
        </div>
      )}

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard icon="🎬" label="Vidéos publiées" value={videos.filter(v => v.status === 'PUBLISHED').length.toString()} color="blue" />
        <StatCard icon="⏳" label="En attente" value={videos.filter(v => v.status !== 'PUBLISHED').length.toString()} color="orange" />
        <StatCard icon="📩" label="Candidatures reçues" value="0" color="purple" />
      </div>

      {/* Mes vidéos */}
      <div className="rounded-2xl border border-white/10 p-6 bg-white/5 backdrop-blur-md shadow-xl mt-8">
        <h3 className="font-bold text-xl text-white mb-6 flex justify-between items-center" style={{ fontFamily: "'Outfit', sans-serif" }}>
          <span>Mes Vidéos</span>
        </h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-white/20 bg-white/5">
            <span className="text-5xl filter drop-shadow-lg">🎥</span>
            <p className="mt-4 text-gray-400 font-medium text-sm">Vous n'avez pas encore publié de vidéo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {videos.map(video => (
              <div key={video.id} className="rounded-2xl p-5 flex flex-col justify-between transition-all hover:bg-white/10 bg-white/5 border border-white/10 group shadow-lg">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-white truncate text-base group-hover:text-purple-300 transition-colors" title={video.title}>{video.title}</h4>
                    <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold shadow-sm ${
                      video.status === 'PUBLISHED' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      video.status === 'PENDING_CONSENT' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      video.status === 'REJECTED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {video.status === 'PENDING_CONSENT' ? 'Attente parent' : video.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">{video.description}</p>
                </div>
                
                {video.ai_tags && video.ai_tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {video.ai_tags.map(tag => (
                      <span key={tag} className="text-[10px] font-semibold bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-md border border-purple-500/20">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: string; label: string; value: string; color: string }> = ({ icon, label, value, color }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
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
