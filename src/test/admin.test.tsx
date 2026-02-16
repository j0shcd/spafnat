import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminDocuments from '../pages/admin/AdminDocuments';
import AdminPhotos from '../pages/admin/AdminPhotos';
import { RequireAuth } from '../components/admin/RequireAuth';
import { AuthProvider } from '../contexts/AuthContext';
import { DOCUMENTS } from '../config/documents';

// Mock API calls
vi.mock('../lib/admin-api', () => ({
  apiLogin: vi.fn(),
  apiLogout: vi.fn(),
  apiVerify: vi.fn(() => Promise.resolve({ ok: false })),
  apiListDocuments: vi.fn(() => Promise.resolve({ ok: true, data: [] })),
  apiUploadDocument: vi.fn(),
  apiDeleteDocument: vi.fn(),
  apiListPhotos: vi.fn(() => Promise.resolve({ ok: true, data: [] })),
  apiUploadPhoto: vi.fn(),
  apiDeletePhoto: vi.fn(),
  getToken: vi.fn(() => null),
  clearToken: vi.fn(),
}));

// Wrapper for admin components with auth context
const AdminWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/admin/login']}>
    <AuthProvider>{children}</AuthProvider>
  </MemoryRouter>
);

// Wrapper for protected routes
const ProtectedRouteWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/admin']}>
    <AuthProvider>
      <Routes>
        <Route path="/admin/login" element={<div>Login Page</div>} />
        <Route path="/admin" element={<RequireAuth />}>
          <Route index element={children} />
        </Route>
      </Routes>
    </AuthProvider>
  </MemoryRouter>
);

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
});

describe('Admin UI Smoke Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
  });

  describe('Admin Login Page', () => {
    it('renders without crashing', () => {
      render(<AdminLogin />, { wrapper: AdminWrapper });
      expect(screen.getByText(/Administration SPAF/i)).toBeInTheDocument();
    });

    it('displays French labels', () => {
      render(<AdminLogin />, { wrapper: AdminWrapper });
      expect(screen.getByLabelText(/Nom d'utilisateur/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Mot de passe/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Se connecter/i })).toBeInTheDocument();
    });

    it('displays return to site link', () => {
      render(<AdminLogin />, { wrapper: AdminWrapper });
      expect(screen.getByText(/Retour au site/i)).toBeInTheDocument();
    });
  });

  describe('Admin Dashboard Page', () => {
    it('renders without crashing', () => {
      render(<AdminDashboard />, { wrapper: AdminWrapper });
      expect(screen.getByText(/Bienvenue dans l'administration/i)).toBeInTheDocument();
    });

    it('displays quick links', () => {
      render(<AdminDashboard />, { wrapper: AdminWrapper });
      expect(screen.getByText(/Gérer les documents/i)).toBeInTheDocument();
      expect(screen.getByText(/Gérer les photos/i)).toBeInTheDocument();
    });
  });

  describe('Admin Documents Page', () => {
    it('renders without crashing', async () => {
      render(<AdminDocuments />, { wrapper: AdminWrapper });
      await waitFor(() => {
        expect(screen.getByText(/Gestion des documents/i)).toBeInTheDocument();
      });
    });

    it('displays all 8 documents from config', async () => {
      render(<AdminDocuments />, { wrapper: AdminWrapper });

      // Wait for documents to load
      await waitFor(() => {
        expect(screen.queryByText(/Chargement.../i)).not.toBeInTheDocument();
      });

      // Check that all document labels are rendered
      const documentLabels = Object.values(DOCUMENTS).map((doc) => doc.label);
      documentLabels.forEach((label) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });

    it('displays upload and delete buttons for each document', async () => {
      render(<AdminDocuments />, { wrapper: AdminWrapper });

      await waitFor(() => {
        expect(screen.queryByText(/Chargement.../i)).not.toBeInTheDocument();
      });

      // Should have upload buttons for all 8 documents
      const uploadButtons = screen.getAllByText(/Téléverser|Remplacer/i);
      expect(uploadButtons.length).toBe(8);
    });
  });

  describe('Admin Photos Page', () => {
    it('renders without crashing', async () => {
      render(<AdminPhotos />, { wrapper: AdminWrapper });
      await waitFor(() => {
        expect(screen.getByText(/Gestion des photos/i)).toBeInTheDocument();
      });
    });

    it('displays year selector', async () => {
      render(<AdminPhotos />, { wrapper: AdminWrapper });
      await waitFor(() => {
        expect(screen.getByText(/Année du congrès/i)).toBeInTheDocument();
      });
    });

    it('displays upload button', async () => {
      render(<AdminPhotos />, { wrapper: AdminWrapper });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Téléverser des photos/i })).toBeInTheDocument();
      });
    });

    it('displays empty state when no photos', async () => {
      render(<AdminPhotos />, { wrapper: AdminWrapper });
      await waitFor(() => {
        expect(screen.getByText(/Aucune photo pour l'année/i)).toBeInTheDocument();
      });
    });
  });

  describe('RequireAuth Route Guard', () => {
    it('redirects to login when not authenticated', async () => {
      render(<div>Protected Content</div>, { wrapper: ProtectedRouteWrapper });

      // Should redirect to login page
      await waitFor(() => {
        expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
        expect(screen.queryByText(/Protected Content/i)).not.toBeInTheDocument();
      });
    });

    it('shows loading state during verification', () => {
      render(<div>Protected Content</div>, { wrapper: ProtectedRouteWrapper });

      // Initially should show loading (skeleton) or redirect immediately
      // We test that it doesn't immediately show protected content
      expect(screen.queryByText(/Protected Content/i)).not.toBeInTheDocument();
    });
  });
});
