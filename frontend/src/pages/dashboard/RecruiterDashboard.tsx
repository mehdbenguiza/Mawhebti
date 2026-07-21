import React from 'react';

export const RecruiterDashboard: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 text-white font-sans">
      <div>
        <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Espace Recruteur</h2>
        <p className="text-gray-400 mt-2 text-sm">Découvrez les talents, gérez vos campagnes et vos favoris.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard icon="🔍" label="Talents découverts" value="0" color="indigo" />
        <StatCard icon="⭐" label="Favoris" value="0" color="yellow" />
        <StatCard icon="📋" label="Campagnes actives" value="0" color="green" />
      </div>

      <div className="bg-white/5 backdrop-blur-md rounded-2xl shadow-xl border border-white/10 p-6 sm:p-8 mt-8">
        <h3 className="font-bold text-xl text-white mb-6" style={{ fontFamily: "'Outfit', sans-serif" }}>Prochaines étapes</h3>
        <ul className="space-y-4">
          <ActionItem done={false} label="Compléter votre profil recruteur" description="Présentez votre agence ou entreprise aux talents" />
          <ActionItem done={false} label="Créer votre première campagne" description="Recherchez des talents selon vos critères" />
        </ul>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: string; label: string; value: string; color: string }> = ({ icon, label, value, color }) => {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
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

const ActionItem: React.FC<{ done: boolean; label: string; description: string }> = ({ done, label, description }) => (
  <li className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
    <span className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs shadow-md ${done ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-white/20 bg-black/20 text-transparent'}`}>
      {done && '✓'}
    </span>
    <div>
      <p className="font-bold text-white text-sm">{label}</p>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
  </li>
);
