import { it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Delegations from '../pages/Delegations';

const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

afterEach(() => vi.unstubAllGlobals());

it('replaces bundled defaults with API delegations without stale duplicates', async () => {
  vi.stubGlobal('fetch', vi.fn(() =>
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
  ));

  render(<Delegations />, { wrapper: RouterWrapper });

  expect(screen.getAllByText(/Bretagne/i)[0]).toBeInTheDocument();
  await screen.findAllByText(/Région Test/i);
  expect(screen.queryAllByText(/Bretagne/i)).toHaveLength(0);
  expect(screen.getAllByText(/Région Test/i)).toHaveLength(2);
});
