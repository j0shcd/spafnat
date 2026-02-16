import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppRoutes } from '../AppRoutes';

const queryClient = new QueryClient();

// Helper to wrap routes with necessary providers
const renderWithRouter = (initialRoute: string) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <AppRoutes />
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

describe('App Routing', () => {
  beforeEach(() => {
    // Mock fetch for concours API
    global.fetch = vi.fn((url) => {
      if (typeof url === 'string' && url.includes('/api/concours')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            reglements: [],
            'palmares-poetique': [],
            'palmares-artistique': [],
          }),
        });
      }
      return Promise.reject(new Error('Not found'));
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Index page at root path', () => {
    renderWithRouter('/');
    expect(screen.getAllByText(/Société des Poètes et Artistes de France/i)[0]).toBeInTheDocument();
  });

  it('renders Historique page at /historique', () => {
    renderWithRouter('/historique');
    expect(screen.getByText(/Notre Histoire/i)).toBeInTheDocument();
  });

  it('renders Congres page at /congres', () => {
    renderWithRouter('/congres');
    expect(screen.getAllByText(/Congrès National/i)[0]).toBeInTheDocument();
  });

  it('renders Concours page at /concours', async () => {
    renderWithRouter('/concours');
    await screen.findByText(/Concours Nationaux/i);
    expect(screen.getByText(/Concours Nationaux/i)).toBeInTheDocument();
  });

  it('renders Revue page at /revue', () => {
    renderWithRouter('/revue');
    expect(screen.getByText(/Notre Revue/i)).toBeInTheDocument();
  });

  it('renders Delegations page at /delegations', () => {
    renderWithRouter('/delegations');
    expect(screen.getAllByText(/Délégations Régionales/i)[0]).toBeInTheDocument();
  });

  it('renders NotFound page for unknown routes', () => {
    renderWithRouter('/unknown-route');
    expect(screen.getByText(/Site en construction/i)).toBeInTheDocument();
  });
});
