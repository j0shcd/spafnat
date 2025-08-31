import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, BookOpen, Users, Calendar } from "lucide-react";

const Revue = () => {
  const notableContributors = [
    { name: "Jean-Pierre Siméon", role: "Poète et dramaturge", description: "Ancien directeur artistique du Printemps des Poètes" },
    { name: "Marie-Claire Bancquart", role: "Poétesse et critique", description: "Prix Goncourt de la Poésie 2009" },
    { name: "James Sacré", role: "Poète", description: "Grand Prix de Poésie de l'Académie française" },
    { name: "Véronique Pittolo", role: "Poétesse et traductrice", description: "Prix Apollinaire 2018" },
    { name: "Christian Bobin", role: "Écrivain et poète", description: "Prix des Deux Magots 1993" },
    { name: "Alain Borer", role: "Poète et essayiste", description: "Spécialiste de Rimbaud" },
  ];

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <header className="text-center mb-12">
          <h1 className="font-serif-title text-4xl md:text-5xl font-bold text-primary mb-4">
            Notre Revue
          </h1>
          <div className="w-24 h-1 bg-accent mx-auto mb-6"></div>
          <p className="font-sans text-lg text-muted-foreground max-w-3xl mx-auto">
            Publication mensuelle de référence pour la poésie et les arts en France
          </p>
        </header>

        {/* Current Issue */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Magazine Cover */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-[3/4] bg-gradient-to-br from-primary via-secondary to-accent relative flex items-center justify-center">
                <div className="text-center text-primary-foreground p-8">
                  <h3 className="font-serif-title text-3xl font-bold mb-4">
                    SPAF REVUE
                  </h3>
                  <p className="font-sans text-lg mb-2">N° 785 - Décembre 2024</p>
                  <div className="w-16 h-0.5 bg-artistic-yellow mx-auto mb-4"></div>
                  <p className="font-serif-title text-xl italic">
                    "Poésie d'Hiver"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Magazine Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2 mb-2">
                  <BookOpen className="h-5 w-5 text-accent" />
                  <Badge variant="secondary">Numéro actuel</Badge>
                </div>
                <CardTitle className="font-serif-title text-2xl text-primary">
                  Revue SPAF - Décembre 2024
                </CardTitle>
                <CardDescription className="font-sans">
                  Thème : "Poésie d'Hiver - Quand les mots réchauffent l'âme"
                </CardDescription>
              </CardHeader>
              <CardContent className="font-sans space-y-4">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Décembre 2024</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BookOpen className="h-4 w-4" />
                    <span>48 pages</span>
                  </div>
                </div>
                <p className="text-foreground">
                  Cette édition explore les multiples facettes de la poésie hivernale, 
                  des paysages enneigés aux méditations intérieures, en passant par 
                  les traditions littéraires de fin d'année.
                </p>
                <div className="flex space-x-3">
                  <Button variant="default" className="flex items-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Télécharger l'extrait</span>
                  </Button>
                  <Button variant="outline">
                    Voir le sommaire
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Info */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="font-serif-title text-xl text-primary">
                  S'abonner à la revue
                </CardTitle>
              </CardHeader>
              <CardContent className="font-sans space-y-3">
                <p className="text-foreground">
                  Recevez chaque mois notre revue directement chez vous.
                </p>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Abonnement annuel :</strong> 45€ (12 numéros)
                  </p>
                  <p className="text-sm">
                    <strong>Abonnement de soutien :</strong> 60€ (12 numéros + avantages)
                  </p>
                </div>
                <Button variant="secondary" className="w-full">
                  Bulletin d'abonnement (PDF)
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Notable Contributors */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-5 w-5 text-accent" />
              <Badge variant="outline" className="border-accent text-accent">
                Contributeurs
              </Badge>
            </div>
            <CardTitle className="font-serif-title text-2xl text-primary">
              Nos Contributeurs de Renom
            </CardTitle>
            <CardDescription className="font-sans">
              Découvrez quelques-unes des plumes prestigieuses qui ont enrichi nos pages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {notableContributors.map((contributor, index) => (
                <div key={index} className="border-l-4 border-artistic-yellow pl-4">
                  <h4 className="font-serif-title text-lg font-semibold text-primary">
                    {contributor.name}
                  </h4>
                  <p className="font-sans text-secondary font-medium mb-1">
                    {contributor.role}
                  </p>
                  <p className="font-sans text-sm text-muted-foreground">
                    {contributor.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Revue;