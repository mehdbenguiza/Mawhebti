import React from 'react';
import { useAuthStore } from '../../store/authStore';

export const TalentDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isMinor = user?.role === 'TALENT_MINOR';

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
        <StatCard icon="🎬" label="Vidéos publiées" value="0" color="blue" />
        <StatCard icon="👁️" label="Vues totales" value="0" color="green" />
        <StatCard icon="📩" label="Candidatures reçues" value="0" color="purple" />
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Prochaines étapes</h3>
        <ul className="space-y-3">
          <ActionItem
            done={false}
            label="Compléter votre profil"
            description="Ajoutez votre bio, vos compétences et votre ville"
            link="profile"
          />
          <ActionItem
            done={false}
            label="Uploader votre première vidéo"
            description="Présentez votre talent en moins de 3 minutes"
            link="videos"
          />
        </ul>
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
