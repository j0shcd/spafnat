import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import AdminGuide from '../pages/admin/AdminGuide';

describe('printable user guide', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('prints only on request and keeps every FAQ answer available for the PDF', () => {
    vi.stubGlobal('IntersectionObserver', class {
      observe() {}
      disconnect() {}
    });
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    const { container } = render(<AdminGuide />);
    expect(print).not.toHaveBeenCalled();
    expect(container.querySelectorAll('[role="region"]')).toHaveLength(5);
    expect(screen.getByText(/Pour les photos, le site vous propose de les réduire automatiquement/)).toBeInTheDocument();
    expect(screen.queryByText(/iLoveIMG/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Imprimer ou enregistrer en PDF' }));
    expect(print).toHaveBeenCalledOnce();
  });
});
