/**
 * RequireAuth Route Guard
 *
 * Protects admin routes. Redirects to /admin/login if not authenticated.
 * Shows loading skeleton during initial token verification.
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state during initial verification (prevents flash of login page)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-8 w-48" />
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Render child routes
  return <Outlet />;
}
