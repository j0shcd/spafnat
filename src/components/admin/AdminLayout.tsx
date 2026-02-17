/**
 * Admin Layout
 *
 * Simple layout with top bar + sidebar navigation. No public Header/Footer.
 * Mobile: sidebar collapses, hamburger menu using Sheet component.
 * Large touch targets (min-h-[44px]) and large fonts (text-lg) for elderly user.
 */

import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FileText, Image, LogOut, Menu, Home, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { to: '/admin/documents', label: 'Documents', icon: FileText },
  { to: '/admin/concours', label: 'Concours', icon: Award },
  { to: '/admin/photos', label: 'Photos', icon: Image },
];

function Sidebar({ onBackToSite }: { onBackToSite: () => void }) {
  const { logout } = useAuth();

  return (
    <nav className="flex flex-col h-full">
      <div className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 min-h-[44px] text-lg rounded-md transition-colors ${
                  isActive
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          );
        })}
      </div>

      <div className="p-4 border-t space-y-2">
        <Button
          variant="outline"
          className="w-full min-h-[44px] text-lg justify-start"
          onClick={onBackToSite}
        >
          <Home className="h-5 w-5 mr-3" />
          Retour au site
        </Button>
        <Button
          variant="outline"
          className="w-full min-h-[44px] text-lg justify-start"
          onClick={() => {
            void logout();
          }}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Déconnexion
        </Button>
      </div>
    </nav>
  );
}

export function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleBackToSite = () => {
    // Logout and navigate to public site
    void logout('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <header className="border-b bg-background">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="py-4">
                  <h2 className="px-4 text-xl font-serif-title font-bold text-primary mb-4">
                    Administration SPAF
                  </h2>
                  <Sidebar onBackToSite={handleBackToSite} />
                </div>
              </SheetContent>
            </Sheet>

            <h1 className="text-xl font-serif-title font-bold text-primary">
              Administration SPAF
            </h1>
          </div>

          {/* Desktop buttons */}
          <div className="hidden lg:flex gap-2">
            <Button variant="ghost" onClick={handleBackToSite}>
              <Home className="h-4 w-4 mr-2" />
              Retour au site
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                void logout();
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 border-r bg-muted/30">
          <Sidebar onBackToSite={handleBackToSite} />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
