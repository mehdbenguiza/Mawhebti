import React from 'react';
import { Link } from 'react-router-dom';

export interface TalentCardProps {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  city?: string | null;
  country?: string | null;
  skills: string[];
  isVerified: boolean;
  videoCount?: number;
  aiScore?: number;
}

export const TalentCard: React.FC<TalentCardProps> = ({
  id,
  firstName,
  lastName,
  avatarUrl,
  city,
  country,
  skills,
  isVerified,
  videoCount = 0,
  aiScore,
}) => {
  return (
    <div className="relative group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(124,58,237,0.15)] hover:bg-white/10 flex flex-col h-full">
      {/* En-tête de la carte avec avatar */}
      <div className="p-5 flex items-start gap-4">
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-tr from-purple-600 to-blue-600 p-0.5">
            <div className="w-full h-full rounded-full bg-[#13131a] flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={`${firstName} ${lastName}`} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white/50">{firstName?.[0] || '?'}{lastName?.[0] || '?'}</span>
              )}
            </div>
          </div>
          {isVerified && (
            <div className="absolute -bottom-1 -right-1 bg-teal-500 text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full border-2 border-[#13131a]" title="Profil vérifié">
              ✓
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white truncate flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {firstName} {lastName}
          </h3>
          {(city || country) && (
            <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-1">
              <span>📍</span>
              <span className="truncate">{[city, country].filter(Boolean).join(', ')}</span>
            </p>
          )}
          
          <div className="flex items-center gap-3 mt-2 text-xs font-semibold">
            <span className="flex items-center gap-1 text-gray-300 bg-white/5 px-2 py-1 rounded-md border border-white/10">
              <span className="text-purple-400">🎥</span> {videoCount} vidéos
            </span>
            {aiScore !== undefined && (
              <span className="flex items-center gap-1 text-teal-300 bg-teal-500/10 px-2 py-1 rounded-md border border-teal-500/20">
                <span className="text-teal-400">🤖</span> Score IA: {aiScore}%
              </span>
            )}
          </div>
        </div>
        
        {/* Favoris Button */}
        <button 
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors border border-transparent hover:border-yellow-400/20"
          title="Sauvegarder"
          onClick={(e) => {
            e.preventDefault();
            // Mock Favoris action
            alert(`Profil de ${firstName} ajouté aux favoris ! ⭐`);
          }}
        >
          ⭐
        </button>
      </div>

      {/* Compétences */}
      <div className="px-5 pb-5 flex-1">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Compétences principales</h4>
        <div className="flex flex-wrap gap-2">
          {skills.slice(0, 5).map((skill, idx) => (
            <span key={idx} className="text-[11px] font-medium bg-purple-500/10 text-purple-300 px-2.5 py-1.5 rounded-lg border border-purple-500/20">
              {skill}
            </span>
          ))}
          {skills.length > 5 && (
            <span className="text-[11px] font-medium bg-white/5 text-gray-400 px-2.5 py-1.5 rounded-lg border border-white/10">
              +{skills.length - 5}
            </span>
          )}
          {skills.length === 0 && (
            <span className="text-sm text-gray-500 italic">Aucune compétence renseignée</span>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="p-3 border-t border-white/10 mt-auto bg-black/20">
        <Link 
          to={`/talents/${id}`} 
          className="block w-full py-2.5 text-center text-sm font-bold text-white rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
        >
          Voir le profil complet
        </Link>
      </div>
    </div>
  );
};
