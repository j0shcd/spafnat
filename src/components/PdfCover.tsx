/**
 * PDF Cover Component
 *
 * Renders the first page of a PDF as a cover image using pdfjs-dist.
 * Shows gradient fallback while loading or on error.
 */

import { useEffect, useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface PdfCoverProps {
  url: string;
  alt?: string;
  className?: string;
}

export function PdfCover({ url, alt = 'PDF Cover', className = '' }: PdfCoverProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isMounted = true;

    const renderPdfCover = async () => {
      if (!canvasRef.current) return;

      try {
        setIsLoading(true);
        setHasError(false);

        // Load PDF
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        if (!isMounted) return;

        // Get first page
        const page = await pdf.getPage(1);

        if (!isMounted) return;

        // Set canvas dimensions
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Could not get canvas context');
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render page
        await page.render({
          canvas,
          canvasContext: context,
          viewport,
        }).promise;

        if (isMounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to render PDF cover:', error);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    renderPdfCover();

    return () => {
      isMounted = false;
    };
  }, [url]);

  return (
    <div className={`relative ${className}`}>
      {/* Canvas for PDF rendering */}
      <canvas
        ref={canvasRef}
        className={`w-full h-auto rounded-lg shadow-xl ${
          isLoading || hasError ? 'hidden' : 'block'
        }`}
        aria-label={alt}
      />

      {/* Gradient fallback (loading or error) */}
      {(isLoading || hasError) && (
        <div className="w-full h-64 md:h-96 rounded-lg shadow-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <div className="text-primary-foreground text-center p-4">
            {isLoading ? (
              <p className="text-sm">Chargement...</p>
            ) : (
              <p className="text-sm">Aperçu non disponible</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
