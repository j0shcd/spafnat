import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, MapPin } from "lucide-react";

const Congres = () => {
  const palmaresPoeticque = [
    { category: "Grand Prix National de Poésie", winner: "Marie Durand", work: "Éclats de lumière", year: "2024" },
    { category: "Prix Jeune Talent", winner: "Antoine Moreau", work: "Murmures urbains", year: "2024" },
    { category: "Prix de la Forme Libre", winner: "Sophie Legrand", work: "Fragments d'âme", year: "2024" },
    { category: "Prix du Sonnet", winner: "Jean-Paul Martin", work: "Saisons perdues", year: "2024" },
  ];

  const palmaresArtistique = [
    { category: "Grand Prix Arts Plastiques", winner: "Claude Rousseau", work: "Série Métamorphoses", year: "2024" },
    { category: "Prix Photographie", winner: "Élise Bonnet", work: "Regards croisés", year: "2024" },
    { category: "Prix Nouvelles Technologies", winner: "David Chen", work: "Poésie Interactive", year: "2024" },
    { category: "Prix Illustration", winner: "Anna Kowalski", work: "Carnets de voyage", year: "2024" },
  ];

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <header className="text-center mb-12">
          <h1 className="font-serif-title text-4xl md:text-5xl font-bold text-primary mb-4">
            Congrès National
          </h1>
          <div className="w-24 h-1 bg-accent mx-auto mb-6"></div>
          <p className="font-sans text-lg text-muted-foreground max-w-3xl mx-auto">
            Découvrez nos événements nationaux et les lauréats de nos prestigieux concours
          </p>
        </header>

        {/* Awards Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Palmarès Poétique */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 mb-2">
                <Trophy className="h-5 w-5 text-artistic-yellow" />
                <Badge variant="outline" className="border-artistic-yellow text-artistic-yellow">
                  Poésie
                </Badge>
              </div>
              <CardTitle className="font-serif-title text-2xl text-primary">
                Palmarès Poétique 2024
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {palmaresPoeticque.map((award, index) => (
                  <div key={index} className="border-l-4 border-artistic-yellow pl-4">
                    <h4 className="font-sans font-semibold text-foreground">
                      {award.category}
                    </h4>
                    <p className="font-sans text-primary font-medium">
                      {award.winner}
                    </p>
                    <p className="font-sans text-sm text-muted-foreground italic">
                      "{award.work}"
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Palmarès Artistique */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 mb-2">
                <Trophy className="h-5 w-5 text-artistic-orange" />
                <Badge variant="outline" className="border-artistic-orange text-artistic-orange">
                  Arts Plastiques
                </Badge>
              </div>
              <CardTitle className="font-serif-title text-2xl text-primary">
                Palmarès Artistique 2024
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {palmaresArtistique.map((award, index) => (
                  <div key={index} className="border-l-4 border-artistic-orange pl-4">
                    <h4 className="font-sans font-semibold text-foreground">
                      {award.category}
                    </h4>
                    <p className="font-sans text-primary font-medium">
                      {award.winner}
                    </p>
                    <p className="font-sans text-sm text-muted-foreground italic">
                      "{award.work}"
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Congress Info */}
        <Card className="mb-12 bg-gradient-to-r from-accent/5 to-artistic-yellow/5 border-accent/20">
          <CardHeader>
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="h-5 w-5 text-accent" />
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                Prochain événement
              </Badge>
            </div>
            <CardTitle className="font-serif-title text-2xl text-primary">
              Congrès National 2025
            </CardTitle>
            <CardDescription className="font-sans text-lg">
              L'événement phare de l'année artistique française
            </CardDescription>
          </CardHeader>
          <CardContent className="font-sans space-y-4">
            <div className="flex items-center space-x-2 text-foreground">
              <MapPin className="h-4 w-4 text-accent" />
              <span>Lyon - Palais des Congrès</span>
            </div>
            <div className="flex items-center space-x-2 text-foreground">
              <Calendar className="h-4 w-4 text-accent" />
              <span>15-17 Mai 2025</span>
            </div>
            <p className="text-muted-foreground">
              Trois jours de rencontres, d'ateliers, de lectures publiques et de remises de prix. 
              Plus d'informations seront communiquées prochainement aux membres.
            </p>
          </CardContent>
        </Card>

        {/* Photo Gallery Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif-title text-2xl text-primary">
              Galerie des Congrès Précédents
            </CardTitle>
            <CardDescription className="font-sans">
              Revivez les moments forts de nos événements nationaux
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[2023, 2022, 2021].map((year) => (
                <div key={year} className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <p className="font-serif-title text-xl text-muted-foreground">
                      Congrès {year}
                    </p>
                    <p className="font-sans text-sm text-muted-foreground">
                      Galerie photo à venir
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Congres;