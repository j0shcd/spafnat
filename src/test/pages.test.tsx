import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Index from '../pages/Index';
import Historique from '../pages/Historique';
import Congres from '../pages/Congres';
import Concours from '../pages/Concours';
import Revue from '../pages/Revue';
import Delegations from '../pages/Delegations';

// Wrapper for components that use React Router
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Pages Smoke Tests', () => {
  describe('Index Page', () => {
    it('displays key sections', () => {
      render(<Index />, { wrapper: RouterWrapper });
      expect(screen.getByText(/Notre communauté/i)).toBeInTheDocument();
      expect(screen.getByText(/Nos activités/i)).toBeInTheDocument();
      expect(screen.getByText(/Nos documents/i)).toBeInTheDocument();
    });
  });

  describe('Historique Page', () => {
    it('displays presidents list', () => {
      render(<Historique />, { wrapper: RouterWrapper });
      expect(screen.getAllByText(/Pascal LECORDIER/i)[0]).toBeInTheDocument();
    });
  });

  describe('Congres Page', () => {
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
          headers: { get: () => 'application/json' },
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

    it('displays both contest sections', async () => {
      render(<Concours />, { wrapper: RouterWrapper });
      await screen.findByText(/Concours Nationaux/i);
      expect(screen.getByText(/Grands Prix de Poésie/i)).toBeInTheDocument();
      expect(screen.getByText(/Grands Prix Artistiques/i)).toBeInTheDocument();
    });
  });

  describe('Revue Page', () => {
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
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('displays delegations list', () => {
      render(<Delegations />, { wrapper: RouterWrapper });
      expect(screen.getAllByText(/Bretagne/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Occitanie/i)[0]).toBeInTheDocument();
    });

    it('does not display duplicate Occitanie entries', () => {
      render(<Delegations />, { wrapper: RouterWrapper });
      const occitanieElements = screen.getAllByText(/Occitanie/i);
      // Should appear only once in the page (plus potentially in headers/footers)
      expect(occitanieElements.length).toBeLessThan(3);
    });

    it('replaces bundled defaults with API delegations without stale duplicates', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve({
            delegations: [
              {
                id: 'test-region',
                region: 'Région Test',
                delegate: 'Camille Martin',
                gender: 'F',
                address: '1 rue du Test',
              },
            ],
          }),
        })
      ) as unknown as typeof fetch;

      render(<Delegations />, { wrapper: RouterWrapper });

      expect(screen.getAllByText(/Bretagne/i)[0]).toBeInTheDocument();
      await screen.findAllByText(/Région Test/i);
      expect(screen.queryAllByText(/Bretagne/i)).toHaveLength(0);
      expect(screen.getAllByText(/Région Test/i)).toHaveLength(2);
    });
  });
});
