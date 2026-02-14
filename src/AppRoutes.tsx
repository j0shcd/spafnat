import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Historique from "./pages/Historique";
import Congres from "./pages/Congres";
import Concours from "./pages/Concours";
import Revue from "./pages/Revue";
import Delegations from "./pages/Delegations";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";

/**
 * Application routes - separated from App.tsx for easier testing.
 * This component defines all routes without the router wrapper,
 * allowing it to be used with different routers (BrowserRouter for production,
 * MemoryRouter for tests).
 */
export const AppRoutes = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/historique" element={<Historique />} />
      <Route path="/congres" element={<Congres />} />
      <Route path="/concours" element={<Concours />} />
      <Route path="/revue" element={<Revue />} />
      <Route path="/delegations" element={<Delegations />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Layout>
);
