import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleRoute } from './components/auth/RoleRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { TalentDashboard } from './pages/dashboard/TalentDashboard';
import { UploadVideoPage } from './pages/dashboard/UploadVideoPage';
import { RecruiterDashboard } from './pages/dashboard/RecruiterDashboard';
import { ParentDashboard } from './pages/dashboard/ParentDashboard';
import { ProfilePage } from './pages/profile/ProfilePage';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

/**
 * Redirige automatiquement un utilisateur connecté vers son dashboard selon son rôle.
 */
function RoleRedirect() {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate to="/login" replace />;

  const roleMap: Record<string, string> = {
    TALENT_MINOR: '/dashboard/talent/overview',
    TALENT_MAJOR: '/dashboard/talent/overview',
    PARENT: '/dashboard/parent/overview',
    RECRUITER: '/dashboard/recruiter/overview',
    MODERATOR: '/dashboard/talent/overview',
    ADMIN: '/dashboard/talent/overview',
  };
  return <Navigate to={roleMap[user.role] ?? '/login'} replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Routes publiques */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Redirect racine */}
          <Route path="/" element={<RoleRedirect />} />

          {/* Dashboard Talent (Majeur et Mineur) */}
          <Route
            path="/dashboard/talent"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['TALENT_MINOR', 'TALENT_MAJOR', 'MODERATOR', 'ADMIN']}>
                  <DashboardLayout />
                </RoleRoute>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<TalentDashboard />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="upload" element={<UploadVideoPage />} />
          </Route>

          {/* Dashboard Recruteur */}
          <Route
            path="/dashboard/recruiter"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['RECRUITER', 'ADMIN']}>
                  <DashboardLayout />
                </RoleRoute>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<RecruiterDashboard />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Dashboard Parent */}
          <Route
            path="/dashboard/parent"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['PARENT', 'ADMIN']}>
                  <DashboardLayout />
                </RoleRoute>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<ParentDashboard />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Fallback : toute URL inconnue redirige selon le rôle */}
          <Route path="*" element={<RoleRedirect />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
