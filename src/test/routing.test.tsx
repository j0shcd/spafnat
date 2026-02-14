import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

describe('App Routing', () => {
  it('renders Index page at root path', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/Société des Poètes et Artistes de France/i)).toBeInTheDocument();
  });

  it('renders Historique page at /historique', () => {
    render(
      <MemoryRouter initialEntries={['/historique']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/Notre Histoire/i)).toBeInTheDocument();
  });

  it('renders Congres page at /congres', () => {
    render(
      <MemoryRouter initialEntries={['/congres']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/Congrès National/i)).toBeInTheDocument();
  });

  it('renders Concours page at /concours', () => {
    render(
      <MemoryRouter initialEntries={['/concours']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/Concours Nationaux/i)).toBeInTheDocument();
  });

  it('renders Revue page at /revue', () => {
    render(
      <MemoryRouter initialEntries={['/revue']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/Notre Revue/i)).toBeInTheDocument();
  });

  it('renders Delegations page at /delegations', () => {
    render(
      <MemoryRouter initialEntries={['/delegations']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/Délégations Régionales/i)).toBeInTheDocument();
  });

  it('renders NotFound page for unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-route']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/404/i)).toBeInTheDocument();
  });
});
