/**
 * PDF Cover Component
 *
 * Renders the first page of a PDF as a cover image.
 * Shows gradient fallback while loading or on error.
 */

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getCachedPdfCover, prefetchPdfCover } from '@/lib/pdfCoverCache';

interface PdfCoverProps {
  url: string;
  alt?: string;
  className?: string;
}

export function PdfCover({ url, alt = 'PDF Cover', className = '' }: PdfCoverProps) {
  const [coverSrc, setCoverSrc] = useState<string | null>(() => getCachedPdfCover(url));
  const [isLoading, setIsLoading] = useState(() => getCachedPdfCover(url) === null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const cachedCover = getCachedPdfCover(url);

    if (cachedCover) {
      setCoverSrc(cachedCover);
      setHasError(false);
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    setCoverSrc(null);
    setIsLoading(true);
    setHasError(false);

    prefetchPdfCover(url)
      .then((nextCoverSrc) => {
        if (!isMounted) return;
        setCoverSrc(nextCoverSrc);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to render PDF cover:', error);
        if (!isMounted) return;
        setHasError(true);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [url]);

  return (
    <div className={`relative ${className}`}>
      {coverSrc && !hasError && (
        <img
          src={coverSrc}
          alt={alt}
          loading="eager"
          decoding="async"
          className="w-full h-auto rounded-lg shadow-xl"
        />
      )}

      {/* Skeleton loading */}
      {isLoading && !hasError && !coverSrc && (
        <div className="relative">
          <Skeleton className="w-full aspect-[3/4] rounded-lg shadow-xl" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-md bg-background/85 px-3 py-2 shadow-sm backdrop-blur-sm">
              <p className="flex items-center gap-2 text-sm text-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                Chargement de l'aperçu...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error fallback */}
      {hasError && !coverSrc && (
        <div className="w-full aspect-[3/4] rounded-lg shadow-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <div className="text-primary-foreground text-center p-4">
            <p className="text-sm">Aperçu non disponible</p>
          </div>
        </div>
      )}
    </div>
  );
}
