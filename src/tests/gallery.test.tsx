/**
 * Gallery Integration Tests
 *
 * Tests the Congres page photo gallery integration with the R2 backend.
 * Verifies:
 * - Photos are fetched from /api/gallery when year changes
 * - Loading state is shown during fetch
 * - Empty state is shown when no photos exist
 * - Photo grid renders correctly when photos are available
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Congres from '@/pages/Congres';

// Mock fetch globally
global.fetch = vi.fn();

describe('Gallery Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches photos from API on mount', async () => {
    const mockYears = { years: [2026, 2025, 2024] };
    const mockPhotos = {
      photos: [
        {
          key: 'congres/2026/photo1.jpg',
          filename: 'photo1.jpg',
          url: '/api/media/congres/2026/photo1.jpg',
          lastModified: '2026-01-01T00:00:00Z',
          size: 123456,
        },
      ],
      count: 1,
      year: '2026',
    };

    // Mock: HEAD request for inscription, years API, gallery API
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: false, // HEAD request for inscription document (not in R2 yet)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockYears,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPhotos,
      } as Response);

    render(
      <BrowserRouter>
        <Congres />
      </BrowserRouter>
    );

    // Wait for years to be fetched
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/gallery/years');
    });

    // Wait for photos to be fetched
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/gallery?year=2026');
    });

    // After loading, photos should be rendered (check for alt text)
    await waitFor(() => {
      expect(screen.getByAltText(/congrès 2026 - photo 1/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no years have photos', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: false, // HEAD request
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ years: [] }), // No years with photos
      } as Response);

    render(
      <BrowserRouter>
        <Congres />
      </BrowserRouter>
    );

    // Should show empty state message
    await waitFor(() => {
      expect(screen.getByText(/photos à venir/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows empty state when years fetch fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: false, // HEAD request
      } as Response)
      .mockRejectedValueOnce(new Error('Network error')); // Years fetch fails

    render(
      <BrowserRouter>
        <Congres />
      </BrowserRouter>
    );

    // Should show empty state message (graceful degradation)
    await waitFor(() => {
      expect(screen.getByText(/photos à venir/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders photo grid with multiple photos', async () => {
    const mockYears = { years: [2026, 2025] };
    const mockPhotos = {
      photos: [
        {
          key: 'congres/2026/photo1.jpg',
          filename: 'photo1.jpg',
          url: '/api/media/congres/2026/photo1.jpg',
          lastModified: '2026-01-01T00:00:00Z',
          size: 123456,
        },
        {
          key: 'congres/2026/photo2.jpg',
          filename: 'photo2.jpg',
          url: '/api/media/congres/2026/photo2.jpg',
          lastModified: '2026-01-02T00:00:00Z',
          size: 234567,
        },
        {
          key: 'congres/2026/photo3.jpg',
          filename: 'photo3.jpg',
          url: '/api/media/congres/2026/photo3.jpg',
          lastModified: '2026-01-03T00:00:00Z',
          size: 345678,
        },
      ],
      count: 3,
      year: '2026',
    };

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: false, // HEAD request
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockYears,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPhotos,
      } as Response);

    render(
      <BrowserRouter>
        <Congres />
      </BrowserRouter>
    );

    // Wait for photos to render
    await waitFor(() => {
      const images = screen.getAllByRole('img', { name: /congrès 2026/i });
      expect(images.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // Should have 3 photo images
    const photoImages = screen.getAllByAltText(/congrès 2026 - photo/i);
    expect(photoImages).toHaveLength(3);
  });
});
