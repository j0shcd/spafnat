/**
 * Admin Dashboard
 *
 * Welcome page with quick-link cards to Documents and Photos pages.
 * Large touch targets (min-h-[88px]) for elderly user.
 */

import { Link } from 'react-router-dom';
import { FileText, Image } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboard() {
  const quickLinks = [
    {
      to: '/admin/documents',
      title: 'Gérer les documents',
      description: 'Téléverser et supprimer des documents PDF',
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      to: '/admin/photos',
      title: 'Gérer les photos',
      description: 'Téléverser et supprimer des photos de congrès',
      icon: Image,
      color: 'text-green-600',
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-serif-title font-bold text-primary mb-2">
          Bienvenue dans l'administration
        </h1>
        <p className="text-lg text-muted-foreground">
          Gérez les documents et photos du site SPAF
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.to} to={link.to}>
              <Card className="hover:shadow-lg transition-shadow min-h-[88px] cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-3 rounded-lg bg-muted ${link.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl font-serif-title">
                      {link.title}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {link.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
