/**
 * Admin Dashboard
 *
 * Redirects to /admin/documents (removed dashboard UI per Phase 3b polish).
 */

import { Navigate } from 'react-router-dom';

export default function AdminDashboard() {
  return <Navigate to="/admin/documents" replace />;
}
