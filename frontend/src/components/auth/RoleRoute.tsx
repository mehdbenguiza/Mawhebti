import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

/**
 * Protège les routes en vérifiant le rôle de l'utilisateur connecté.
 * Sécurité côté client : un Talent ne peut pas accéder aux vues Recruteur.
 * NOTE : La vraie vérification d'autorisation reste sur le Backend (JWT + RBAC).
 * Ce composant est uniquement une couche UX pour éviter des erreurs côté client.
 */
export const RoleRoute: React.FC<RoleRouteProps> = ({ children, allowedRoles }) => {
  const user = useAuthStore((state) => state.user);

  if (!user || !allowedRoles.includes(user.role)) {
    // Redirige vers le bon dashboard selon le rôle réel de l'utilisateur
    const dashboardPath = user ? `/dashboard/${user.role.toLowerCase().replace('_', '-')}` : '/login';
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
};
