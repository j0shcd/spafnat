import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Index from '../pages/Index';
import Historique from '../pages/Historique';
import Congres from '../pages/Congres';
import Concours from '../pages/Concours';
import Revue from '../pages/Revue';
import Delegations from '../pages/Delegations';
import NotFound from '../pages/NotFound';

// Wrapper for components that use React Router
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Pages Smoke Tests', () => {
  describe('Index Page', () => {
    it('renders without crashing', () => {
      render(<Index />, { wrapper: RouterWrapper });
      expect(screen.getByText(/Société des Poètes et Artistes de France/i)).toBeInTheDocument();
    });

    it('displays key sections', () => {
      render(<Index />, { wrapper: RouterWrapper });
      expect(screen.getByText(/Notre communauté/i)).toBeInTheDocument();
      expect(screen.getByText(/Nos actions/i)).toBeInTheDocument();
      expect(screen.getByText(/Nos documents/i)).toBeInTheDocument();
    });
  });

  describe('Historique Page', () => {
    it('renders without crashing', () => {
      render(<Historique />, { wrapper: RouterWrapper });
      expect(screen.getByText(/Notre Histoire/i)).toBeInTheDocument();
    });

    it('displays presidents list', () => {
      render(<Historique />, { wrapper: RouterWrapper });
      expect(screen.getAllByText(/Pascal LECORDIER/i)[0]).toBeInTheDocument();
    });
  });

  describe('Congres Page', () => {
    it('renders without crashing', () => {
      render(<Congres />, { wrapper: RouterWrapper });
      expect(screen.getAllByText(/Congrès National/i)[0]).toBeInTheDocument();
    });

    it('displays next congress information', () => {
      render(<Congres />, { wrapper: RouterWrapper });
      expect(screen.getByText(/Congrès National 2026/i)).toBeInTheDocument();
      expect(screen.getByText(/Villers-sur-Mer/i)).toBeInTheDocument();
    });

    it('displays photo gallery section', () => {
      render(<Congres />, { wrapper: RouterWrapper });
      expect(screen.getByText(/Galerie des Congrès/i)).toBeInTheDocument();
    });
  });

  describe('Concours Page', () => {
    beforeEach(() => {
      // Mock fetch for concours API
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            reglements: [],
            'palmares-poetique': [],
            'palmares-artistique': [],
          }),
        })
      ) as unknown as typeof fetch;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('renders without crashing', async () => {
      render(<Concours />, { wrapper: RouterWrapper });
      // Wait for async data fetching
      await screen.findByText(/Concours Nationaux/i);
      expect(screen.getByText(/Concours Nationaux/i)).toBeInTheDocument();
    });

    it('displays both contest sections', async () => {
      render(<Concours />, { wrapper: RouterWrapper });
      await screen.findByText(/Concours Nationaux/i);
      expect(screen.getByText(/Grands Prix de Poésie/i)).toBeInTheDocument();
      expect(screen.getByText(/Grands Prix Artistiques/i)).toBeInTheDocument();
    });
  });

  describe('Revue Page', () => {
    it('renders without crashing', () => {
      render(<Revue />, { wrapper: RouterWrapper });
      expect(screen.getByText(/Notre Revue/i)).toBeInTheDocument();
    });

    it('displays current issue', () => {
      render(<Revue />, { wrapper: RouterWrapper });
      // Title is dynamic based on uploaded PDF, defaults to "Extrait de la Revue"
      expect(screen.getByText(/Extrait de la Revue/i)).toBeInTheDocument();
    });

    it('displays subscription information', () => {
      render(<Revue />, { wrapper: RouterWrapper });
      expect(screen.getByText(/S'abonner à la revue/i)).toBeInTheDocument();
    });
  });

  describe('Delegations Page', () => {
    it('renders without crashing', () => {
      render(<Delegations />, { wrapper: RouterWrapper });
      expect(screen.getAllByText(/Délégations Régionales/i)[0]).toBeInTheDocument();
    });

    it('displays delegations list', () => {
      render(<Delegations />, { wrapper: RouterWrapper });
      expect(screen.getByText(/Bretagne/i)).toBeInTheDocument();
      expect(screen.getByText(/Occitanie/i)).toBeInTheDocument();
    });

    it('does not display duplicate Occitanie entries', () => {
      render(<Delegations />, { wrapper: RouterWrapper });
      const occitanieElements = screen.getAllByText(/Occitanie/i);
      // Should appear only once in the page (plus potentially in headers/footers)
      expect(occitanieElements.length).toBeLessThan(3);
    });
  });

  describe('NotFound Page', () => {
    it('renders without crashing', () => {
      render(<NotFound />, { wrapper: RouterWrapper });
      expect(screen.getByText(/Site en construction/i)).toBeInTheDocument();
    });
  });
});
