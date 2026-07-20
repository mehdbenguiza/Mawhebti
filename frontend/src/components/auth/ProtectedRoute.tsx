import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protège toutes les routes qui nécessitent une session active.
 * Si l'utilisateur n'est pas connecté (pas de token en store), il est
 * redirigé vers /login avec l'URL d'origine sauvegardée pour y revenir après connexion.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
