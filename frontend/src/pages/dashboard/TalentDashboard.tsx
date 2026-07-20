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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mon espace Talent</h2>
        <p className="text-gray-600 mt-1">
          {isMinor
            ? 'Espace protégé - Votre activité est supervisée par votre parent/tuteur.'
            : 'Gérez votre profil, vos vidéos et vos candidatures.'}
        </p>
      </div>

      {isMinor && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <span className="text-amber-600 text-xl">⚠️</span>
          <div>
            <p className="text-amber-800 font-medium text-sm">Compte Mineur</p>
            <p className="text-amber-700 text-sm mt-1">
              Certaines fonctionnalités sont réservées aux majeurs ou nécessitent le consentement de votre tuteur légal.
            </p>
          </div>
        </div>
      )}

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon="🎬" label="Vidéos publiées" value={videos.filter(v => v.status === 'PUBLISHED').length.toString()} color="blue" />
        <StatCard icon="⏳" label="En attente" value={videos.filter(v => v.status !== 'PUBLISHED').length.toString()} color="orange" />
        <StatCard icon="📩" label="Candidatures reçues" value="0" color="purple" />
      </div>

      {/* Mes vidéos */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex justify-between items-center">
          <span>Mes Vidéos</span>
        </h3>
        
        {isLoading ? (
          <p className="text-gray-500">Chargement de vos vidéos...</p>
        ) : videos.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <span className="text-4xl">🎥</span>
            <p className="mt-2 text-gray-600 font-medium">Vous n'avez pas encore publié de vidéo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map(video => (
              <div key={video.id} className="border rounded-lg p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-800 truncate" title={video.title}>{video.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      video.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                      video.status === 'PENDING_CONSENT' ? 'bg-orange-100 text-orange-700' :
                      video.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {video.status === 'PENDING_CONSENT' ? 'En attente parent' : video.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{video.description}</p>
                </div>
                
                {video.ai_tags && video.ai_tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {video.ai_tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
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
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    purple: 'bg-purple-50 border-purple-100',
  };
  return (
    <div className={`rounded-lg border p-5 ${colors[color] ?? 'bg-gray-50 border-gray-100'}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
};

const ActionItem: React.FC<{ done: boolean; label: string; description: string; link: string }> = ({ done, label, description, link }) => (
  <li className="flex items-start gap-3">
    <span className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>
      {done && '✓'}
    </span>
    <div>
      <p className="font-medium text-gray-800 text-sm">{label}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  </li>
);
