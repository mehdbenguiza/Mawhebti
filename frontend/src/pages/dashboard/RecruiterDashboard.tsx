import React from 'react';

export const RecruiterDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Espace Recruteur</h2>
        <p className="text-gray-600 mt-1">Découvrez les talents, gérez vos campagnes et vos favoris.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon="🔍" label="Talents découverts" value="0" color="indigo" />
        <StatCard icon="⭐" label="Favoris" value="0" color="yellow" />
        <StatCard icon="📋" label="Campagnes actives" value="0" color="green" />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Prochaines étapes</h3>
        <ul className="space-y-3">
          <ActionItem done={false} label="Compléter votre profil recruteur" description="Présentez votre agence ou entreprise aux talents" />
          <ActionItem done={false} label="Créer votre première campagne" description="Recherchez des talents selon vos critères" />
        </ul>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: string; label: string; value: string; color: string }> = ({ icon, label, value, color }) => {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 border-indigo-100',
    yellow: 'bg-yellow-50 border-yellow-100',
    green: 'bg-green-50 border-green-100',
  };
  return (
    <div className={`rounded-lg border p-5 ${colors[color] ?? 'bg-gray-50 border-gray-100'}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
};

const ActionItem: React.FC<{ done: boolean; label: string; description: string }> = ({ done, label, description }) => (
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
