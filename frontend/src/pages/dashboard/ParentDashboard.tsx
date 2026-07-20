import React from 'react';

export const ParentDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Espace Parent / Tuteur</h2>
        <p className="text-gray-600 mt-1">Supervisez l'activité de votre enfant et gérez les autorisations.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <span className="text-blue-600 text-xl">ℹ️</span>
        <div>
          <p className="text-blue-800 font-medium text-sm">Rôle de tuteur légal</p>
          <p className="text-blue-700 text-sm mt-1">
            En tant que parent ou tuteur, vous êtes responsable de l'activité de votre enfant sur la plateforme.
            Votre consentement est requis pour certaines actions (publication de vidéos, candidatures à des missions).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard icon="👦" label="Enfants liés" value="0" color="blue" />
        <StatCard icon="🔔" label="Autorisations en attente" value="0" color="orange" />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Prochaines étapes</h3>
        <ul className="space-y-3">
          <ActionItem done={false} label="Lier un compte enfant" description="Associez le compte de votre enfant mineur à votre espace" />
          <ActionItem done={false} label="Configurer les autorisations" description="Définissez ce que votre enfant peut faire sur la plateforme" />
        </ul>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: string; label: string; value: string; color: string }> = ({ icon, label, value, color }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100',
    orange: 'bg-orange-50 border-orange-100',
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
