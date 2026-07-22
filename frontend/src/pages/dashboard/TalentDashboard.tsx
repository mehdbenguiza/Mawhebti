import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { videoService } from '../../services/video.service';
import type { TalentAnalytics, VideoAnalytics } from '../../types/video';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
};

const statusLabel: Record<string, { label: string; class: string }> = {
  PUBLISHED:      { label: 'Publiée',         class: 'bg-green-500/20 text-green-400 border-green-500/30' },
  PENDING_CONSENT:{ label: 'Attente parent',   class: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  PROCESSING:     { label: 'En traitement',    class: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  UPLOADING:      { label: 'Upload...',         class: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  REJECTED:       { label: 'Rejetée',          class: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

// Conseils IA statiques pour le MVP
const AI_TIPS = [
  { icon: '📈', text: 'Les vidéos de moins de 30 secondes obtiennent en moyenne 40 % de vues supplémentaires.' },
  { icon: '🕐', text: 'Publiez entre 18h et 21h pour maximiser votre audience.' },
  { icon: '🏷️', text: 'Les vidéos avec 3+ tags IA sont découvertes 2× plus souvent dans la recherche.' },
  { icon: '❤️', text: 'Un taux d\'engagement > 5 % indique une audience très engagée. Continuez ainsi !' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const KpiCard: React.FC<{
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  loading?: boolean;
}> = ({ icon, label, value, sub, color, loading }) => {
  const gradients: Record<string, string> = {
    blue:   'from-blue-600/20 to-blue-600/5 border-blue-500/20',
    red:    'from-red-500/20 to-red-500/5 border-red-500/20',
    violet: 'from-violet-600/20 to-violet-600/5 border-violet-500/20',
    green:  'from-green-600/20 to-green-600/5 border-green-500/20',
    yellow: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/20',
    orange: 'from-orange-500/20 to-orange-500/5 border-orange-500/20',
    teal:   'from-teal-500/20 to-teal-500/5 border-teal-500/20',
  };

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${gradients[color] ?? gradients.blue} p-5 flex flex-col justify-between shadow-lg hover:-translate-y-1 transition-transform duration-200`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {loading ? (
          <div className="w-7 h-7 rounded-full border-2 border-current border-t-transparent animate-spin opacity-40" />
        ) : (
          <p className="text-2xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {value}
          </p>
        )}
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider opacity-75">{label}</p>
        {sub && <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

const VideoCard: React.FC<{ video: VideoAnalytics }> = ({ video }) => {
  const st = statusLabel[video.status] ?? { label: video.status, class: 'bg-white/10 text-white border-white/10' };

  return (
    <div className="group rounded-2xl p-5 bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all duration-200 flex flex-col gap-3 shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-bold text-white text-sm truncate group-hover:text-violet-300 transition-colors flex-1" title={video.title}>
          {video.title}
        </h4>
        <span className={`flex-shrink-0 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold border ${st.class}`}>
          {st.label}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="flex items-center gap-1 text-xs text-gray-300 bg-white/5 px-2.5 py-1 rounded-lg">
          <span>👁️</span>
          <span className="font-bold">{formatNumber(video.views_count)}</span>
          <span className="text-gray-500">vues</span>
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-300 bg-white/5 px-2.5 py-1 rounded-lg">
          <span>❤️</span>
          <span className="font-bold">{formatNumber(video.likes_count)}</span>
          <span className="text-gray-500">likes</span>
        </span>
        {video.avg_watch_seconds > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-300 bg-white/5 px-2.5 py-1 rounded-lg">
            <span>⏱</span>
            <span className="font-bold">{video.avg_watch_seconds}s</span>
            <span className="text-gray-500">moy.</span>
          </span>
        )}
        {video.completion_rate > 0 && (
          <span className="flex items-center gap-1 text-xs text-teal-300 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-lg">
            <span>✅</span>
            <span className="font-bold">{video.completion_rate}%</span>
            <span className="opacity-70">complétion</span>
          </span>
        )}
      </div>

      {/* AI Tags */}
      {video.ai_tags && video.ai_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] bg-violet-600/30 text-violet-300 border border-violet-500/20 px-2 py-0.5 rounded-md font-bold">
            🤖 IA
          </span>
          {video.ai_tags.slice(0, 4).map(tag => (
            <span key={tag} className="text-[10px] bg-white/5 border border-white/10 text-gray-400 px-2 py-0.5 rounded-md">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export const TalentDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isMinor = user?.role === 'TALENT_MINOR';

  const { data, isLoading } = useQuery<TalentAnalytics>({
    queryKey: ['talent-dashboard'],
    queryFn: videoService.getMyAnalytics,
    staleTime: 30_000, // 30s cache
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4 sm:p-6 text-white font-sans">

      {/* Header */}
      <div>
        <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Mon Espace Talent
        </h2>
        <p className="text-gray-400 mt-1 text-sm">
          {isMinor
            ? 'Espace protégé — Votre activité est supervisée par votre parent/tuteur.'
            : 'Vos performances, vos vidéos, votre impact.'}
        </p>
      </div>

      {/* Bandeau Mineur */}
      {isMinor && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-5 flex items-start gap-4 shadow-lg">
          <span className="text-yellow-400 text-2xl">⚠️</span>
          <div>
            <p className="text-yellow-400 font-bold text-sm">Compte Mineur</p>
            <p className="text-yellow-200/70 text-sm mt-1 leading-relaxed">
              Certaines fonctionnalités nécessitent le consentement de votre tuteur légal.
            </p>
          </div>
        </div>
      )}

      {/* KPI Grid — 4 cols mobile 2, desktop 4 */}
      <section>
        <h3 className="text-lg font-black text-white mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
          📊 Mes Performances
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard icon="👁️" label="Vues totales"   value={formatNumber(data?.total_views ?? 0)}  color="blue"   loading={isLoading} />
          <KpiCard icon="❤️" label="Likes totaux"   value={formatNumber(data?.total_likes ?? 0)}  color="red"    loading={isLoading} />
          <KpiCard
            icon="📈"
            label="Taux d'engagement"
            value={`${data?.engagement_rate ?? 0}%`}
            sub="likes / vues × 100"
            color="violet"
            loading={isLoading}
          />
          <KpiCard icon="🎬" label="Vidéos publiées" value={data?.published_videos ?? 0}           color="green"  loading={isLoading} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <KpiCard icon="⭐" label="Fois en favori"    value={data?.times_saved_as_favorite ?? 0}  color="yellow" loading={isLoading}
            sub="par des recruteurs" />
          <KpiCard icon="📩" label="Intérêts recruteurs" value={data?.recruiter_contacts ?? 0}      color="teal"   loading={isLoading} />
          <KpiCard icon="⏳" label="En attente"          value={data?.pending_videos ?? 0}           color="orange" loading={isLoading} />
          <KpiCard icon="❌" label="Rejetées"             value={data?.rejected_videos ?? 0}         color="red"    loading={isLoading} />
        </div>
      </section>

      {/* Mes Vidéos */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
            🎬 Mes Vidéos
          </h3>
          <Link
            to="/dashboard/upload"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
          >
            <span>+</span> Nouvelle vidéo
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : !data || data.videos.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-white/20 bg-white/5">
            <span className="text-6xl block mb-4 animate-bounce">🎥</span>
            <p className="text-gray-300 font-bold text-base">Vous n'avez pas encore publié de vidéo</p>
            <p className="text-gray-500 text-sm mt-1">Partagez votre talent avec le monde</p>
            <Link
              to="/dashboard/upload"
              className="inline-block mt-5 px-6 py-3 bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity shadow-xl"
            >
              Uploader ma première vidéo 🚀
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.videos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </section>

      {/* Conseils IA */}
      <section>
        <h3 className="text-lg font-black text-white mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
          🤖 Conseils IA
        </h3>
        <div className="rounded-2xl bg-gradient-to-br from-violet-600/10 to-blue-600/10 border border-violet-500/20 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {AI_TIPS.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xl flex-shrink-0">{tip.icon}</span>
                <p className="text-sm text-gray-300 leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-600 mt-4 text-center">
            Ces conseils sont basés sur les tendances globales de la plateforme. Des analyses personnalisées arriveront bientôt.
          </p>
        </div>
      </section>

    </div>
  );
};
