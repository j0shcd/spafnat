import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Historique from "./pages/Historique";
import Congres from "./pages/Congres";
import Concours from "./pages/Concours";
import Revue from "./pages/Revue";
import Delegations from "./pages/Delegations";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import AdminLogin from "./pages/admin/AdminLogin";
import { AuthProvider } from "./contexts/AuthContext";
import { RequireAuth } from "./components/admin/RequireAuth";
import { AdminLayout } from "./components/admin/AdminLayout";

/**
 * Application routes - separated from App.tsx for easier testing.
 * This component defines all routes without the router wrapper,
 * allowing it to be used with different routers (BrowserRouter for production,
 * MemoryRouter for tests).
 *
 * Admin routes are outside the public Layout to use a separate AdminLayout.
 */
export const AppRoutes = () => (
  <Routes>
    {/* Admin routes — no public Layout, AuthProvider scoped to admin */}
    <Route path="/admin/login" element={<AuthProvider><AdminLogin /></AuthProvider>} />
    <Route
      path="/admin"
      element={
        <AuthProvider>
          <RequireAuth />
        </AuthProvider>
      }
    >
      <Route element={<AdminLayout />}>
        <Route index element={<div>Dashboard Placeholder</div>} />
        <Route path="documents" element={<div>Documents Placeholder</div>} />
        <Route path="photos" element={<div>Photos Placeholder</div>} />
      </Route>
    </Route>

    {/* Public routes — inside Layout */}
    <Route element={<Layout />}>
      <Route path="/" element={<Index />} />
      <Route path="/historique" element={<Historique />} />
      <Route path="/congres" element={<Congres />} />
      <Route path="/concours" element={<Concours />} />
      <Route path="/revue" element={<Revue />} />
      <Route path="/delegations" element={<Delegations />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
);
