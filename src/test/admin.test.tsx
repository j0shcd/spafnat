import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminDocuments from '../pages/admin/AdminDocuments';
import AdminPhotos from '../pages/admin/AdminPhotos';
import AdminDelegations from '../pages/admin/AdminDelegations';
import { RequireAuth } from '../components/admin/RequireAuth';
import { AuthProvider } from '../contexts/AuthContext';
import { DOCUMENTS } from '../config/documents';
import * as adminApi from '../lib/admin-api';

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
  apiListDelegations: vi.fn(() => Promise.resolve({ ok: true, data: [] })),
  apiSaveDelegation: vi.fn(),
  apiDeleteDelegation: vi.fn(),
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
    vi.mocked(adminApi.apiListDelegations).mockResolvedValue({ ok: true, data: [] });
  });

  describe('Admin Login Page', () => {
    it('renders without crashing', () => {
      render(<AdminLogin />, { wrapper: AdminWrapper });
      expect(screen.getByText(/Administration SPAF/i)).toBeInTheDocument();
    });

    it('displays French labels', () => {
      render(<AdminLogin />, { wrapper: AdminWrapper });
      expect(screen.getByLabelText(/Nom d'utilisateur/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Mot de passe/i, { selector: 'input' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Se connecter/i })).toBeInTheDocument();
    });

    it('displays return to site link', () => {
      render(<AdminLogin />, { wrapper: AdminWrapper });
      expect(screen.getByText(/Retour au site/i)).toBeInTheDocument();
    });
  });

  describe('Admin Dashboard Page', () => {
    it('redirects to documents page', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/documents" element={<div>Documents Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      // AdminDashboard should redirect to /admin/documents
      expect(screen.getByText('Documents Page')).toBeInTheDocument();
    });
  });

  describe('Admin Documents Page', () => {
    it('renders without crashing', async () => {
      render(<AdminDocuments />, { wrapper: AdminWrapper });
      await waitFor(() => {
        expect(screen.getByText(/Gestion des documents/i)).toBeInTheDocument();
      });
    });

    it('displays all 6 documents from config', async () => {
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

      // Should have upload buttons for all 6 documents
      const uploadButtons = screen.getAllByText(/Téléverser|Remplacer/i);
      expect(uploadButtons.length).toBe(6);
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

  describe('Admin Delegations Page', () => {
    it('renders without crashing', async () => {
      render(<AdminDelegations />, { wrapper: AdminWrapper });
      await waitFor(() => {
        expect(screen.getByText(/Gestion des délégations/i)).toBeInTheDocument();
      });
    });

    it('displays add button and empty state', async () => {
      render(<AdminDelegations />, { wrapper: AdminWrapper });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Ajouter une délégation/i })).toBeInTheDocument();
      });
      expect(screen.getByText(/Aucune délégation enregistrée/i)).toBeInTheDocument();
    });

    it('opens a dialog for adding a delegation instead of inserting a draft card', async () => {
      const user = userEvent.setup();
      render(<AdminDelegations />, { wrapper: AdminWrapper });

      await user.click(await screen.findByRole('button', { name: /Ajouter une délégation/i }));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Ajouter une délégation/i })).toBeInTheDocument();
      expect(screen.getByText(/Aucune délégation enregistrée/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Enregistrer/i })).toBeDisabled();
    });

    it('enables save on an existing delegation only after a change', async () => {
      const user = userEvent.setup();
      vi.mocked(adminApi.apiListDelegations).mockResolvedValueOnce({
        ok: true,
        data: [
          {
            id: 'bretagne',
            region: 'Bretagne',
            delegate: 'Loriane Dréan',
            gender: 'F',
            address: '31 Hent Toull Moger, 29000 Quimper',
          },
        ],
      });

      render(<AdminDelegations />, { wrapper: AdminWrapper });

      const saveButton = await screen.findByRole('button', { name: /Enregistrer/i });
      expect(saveButton).toBeDisabled();

      await user.clear(screen.getByLabelText(/Nom du délégué/i));
      await user.type(screen.getByLabelText(/Nom du délégué/i), 'Loriane Test');

      expect(saveButton).toBeEnabled();
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
