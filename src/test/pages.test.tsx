import { describe, it, expect } from 'vitest';
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
      expect(screen.getByText(/Documents à télécharger/i)).toBeInTheDocument();
    });
  });

  describe('Historique Page', () => {
    it('renders without crashing', () => {
      render(<Historique />, { wrapper: RouterWrapper });
      expect(screen.getByText(/Notre Histoire/i)).toBeInTheDocument();
    });

    it('displays presidents list', () => {
      render(<Historique />, { wrapper: RouterWrapper });
      expect(screen.getByText(/Pascal LECORDIER/i)).toBeInTheDocument();
    });
  });

  describe('Congres Page', () => {
    it('renders without crashing', () => {
      render(<Congres />, { wrapper: RouterWrapper });
      expect(screen.getByText(/Congrès National/i)).toBeInTheDocument();
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
    it('renders without crashing', () => {
      render(<Concours />, { wrapper: RouterWrapper });
      expect(screen.getByText(/Concours Nationaux/i)).toBeInTheDocument();
    });

    it('displays both contest sections', () => {
      render(<Concours />, { wrapper: RouterWrapper });
      expect(screen.getByText(/Palmarès Poétique/i)).toBeInTheDocument();
      expect(screen.getByText(/Palmarès Artistique/i)).toBeInTheDocument();
    });
  });

  describe('Revue Page', () => {
    it('renders without crashing', () => {
      render(<Revue />, { wrapper: RouterWrapper });
      expect(screen.getByText(/Notre Revue/i)).toBeInTheDocument();
    });

    it('displays current issue', () => {
      render(<Revue />, { wrapper: RouterWrapper });
      expect(screen.getByText(/Revue n°264/i)).toBeInTheDocument();
    });

    it('displays subscription information', () => {
      render(<Revue />, { wrapper: RouterWrapper });
      expect(screen.getByText(/S'abonner à la revue/i)).toBeInTheDocument();
    });
  });

  describe('Delegations Page', () => {
    it('renders without crashing', () => {
      render(<Delegations />, { wrapper: RouterWrapper });
      expect(screen.getByText(/Délégations Régionales/i)).toBeInTheDocument();
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
      expect(screen.getByText(/404/i)).toBeInTheDocument();
    });
  });
});
