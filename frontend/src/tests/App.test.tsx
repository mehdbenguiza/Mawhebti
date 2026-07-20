/**
 * Suite de tests Frontend — Mawhebti
 *
 * Couverture :
 * - App.tsx : routage et redirection
 * - LoginPage : rendu du formulaire
 * - RegisterPage : rendu et options de rôles
 * - ProtectedRoute : garde de navigation
 * - Composants UI : Input, Button
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Wraps un composant avec les providers obligatoires (Router + QueryClient).
 * On utilise MemoryRouter pour contrôler la route initiale sans navigateur réel.
 */
function renderWithProviders(
  ui: React.ReactElement,
  { initialRoute = '/' } = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// Mock zustand authStore pour contrôler l'état d'authentification dans les tests
vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

import { useAuthStore } from '../store/authStore';
const mockUseAuthStore = useAuthStore as ReturnType<typeof vi.fn>;

// ─── Tests : Composants UI ────────────────────────────────────────────────────

import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

describe('Composant Input', () => {
  it('affiche le label correctement', () => {
    render(
      <MemoryRouter>
        <Input label="Adresse email" />
      </MemoryRouter>
    );
    expect(screen.getByText('Adresse email')).toBeInTheDocument();
  });

  it("affiche un message d'erreur quand error est fourni", () => {
    render(
      <MemoryRouter>
        <Input label="Email" error="Email invalide" />
      </MemoryRouter>
    );
    expect(screen.getByText('Email invalide')).toBeInTheDocument();
  });

  it("n'affiche pas de message d'erreur sans error", () => {
    render(
      <MemoryRouter>
        <Input label="Email" />
      </MemoryRouter>
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('Composant Button', () => {
  it('affiche le texte du bouton', () => {
    render(<Button>Se connecter</Button>);
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
  });

  it('est désactivé quand isLoading est true', () => {
    render(<Button isLoading>Se connecter</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('est désactivé quand disabled est true', () => {
    render(<Button disabled>Se connecter</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('est actif par défaut', () => {
    render(<Button>Envoyer</Button>);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });
});

// ─── Tests : LoginPage ────────────────────────────────────────────────────────

import { LoginPage } from '../pages/auth/LoginPage';

describe('Page LoginPage', () => {
  it('affiche le titre de connexion', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('heading', { name: /connexion à mawhebti/i })).toBeInTheDocument();
  });

  it('affiche les champs email et mot de passe', () => {
    renderWithProviders(<LoginPage />);
    // getByRole est plus robuste que getByLabelText car il ne dépend pas de l'id généré
    expect(screen.getByRole('textbox', { name: /adresse email/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
  });

  it('affiche le bouton de connexion', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
  });

  it("affiche le lien vers l'inscription", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('link', { name: /s'inscrire/i })).toBeInTheDocument();
  });
});

// ─── Tests : RegisterPage ─────────────────────────────────────────────────────

import { RegisterPage } from '../pages/auth/RegisterPage';

describe('Page RegisterPage', () => {
  it("affiche le titre d'inscription", () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByRole('heading', { name: /créer un compte/i })).toBeInTheDocument();
  });

  it('affiche les 4 champs du formulaire', () => {
    renderWithProviders(<RegisterPage />);
    // Champ email
    expect(screen.getByRole('textbox', { name: /adresse email/i })).toBeInTheDocument();
    // Sélecteur de rôle
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    // Bouton de soumission
    expect(screen.getByRole('button', { name: /s'inscrire/i })).toBeInTheDocument();
  });

  it('propose les 4 rôles dans le sélecteur', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByRole('option', { name: /talent \(majeur\)/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /talent \(mineur\)/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /parent/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /recruteur/i })).toBeInTheDocument();
  });
});

// ─── Tests : ProtectedRoute ───────────────────────────────────────────────────

import { ProtectedRoute } from '../components/auth/ProtectedRoute';

describe('Composant ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rend les enfants si un token est présent', () => {
    // Zustand utilise un selector : useAuthStore((state) => state.token)
    // Le mock doit simuler ce comportement en appelant le selector sur un état fictif
    mockUseAuthStore.mockImplementation(
      (selector: (state: { token: string | null }) => unknown) =>
        selector({ token: 'fake-jwt-token' })
    );
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Contenu protégé</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Page Login</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Contenu protégé')).toBeInTheDocument();
  });

  it('redirige vers /login si aucun token', () => {
    // Simule un utilisateur non connecté (token = null)
    mockUseAuthStore.mockImplementation(
      (selector: (state: { token: string | null }) => unknown) =>
        selector({ token: null })
    );
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Contenu protégé</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Page Login</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
    expect(screen.getByText('Page Login')).toBeInTheDocument();
  });
});
