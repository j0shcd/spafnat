import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Trophy, Award } from "lucide-react";
import { DOCUMENTS } from "@/config/documents";

const Concours = () => {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <header className="text-center mb-12">
          <h1 className="font-serif-title text-4xl md:text-5xl font-bold text-primary mb-4">
            Concours Nationaux
          </h1>
          <div className="w-24 h-1 bg-accent mx-auto mb-6"></div>
          <p className="font-sans text-lg text-muted-foreground max-w-2xl mx-auto">
            Découvrez les lauréats de nos concours poétiques et artistiques nationaux
          </p>
        </header>

        {/* Concours Sections */}
        <div className="space-y-8">
          {/* Palmarès Poétique */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 mb-2">
                <Trophy className="h-5 w-5 text-artistic-yellow" />
                <Badge variant="secondary" className="bg-artistic-yellow/10 text-artistic-yellow border-artistic-yellow/20">
                  Poésie
                </Badge>
              </div>
              <CardTitle className="font-serif-title text-3xl text-primary">
                Palmarès Poétique
              </CardTitle>
              <CardDescription className="font-sans">
                Les lauréats du concours national de poésie
              </CardDescription>
            </CardHeader>
            <CardContent className="font-sans">
              <div className="space-y-4">
                <p className="text-foreground">
                  Chaque année, la SPAF récompense les plus belles créations poétiques à travers son concours national.
                  Découvrez les œuvres primées et les talents qui ont marqué cette édition.
                </p>
                <Button
                  variant="default"
                  className="flex items-center space-x-2"
                  disabled={!DOCUMENTS.palmaresPoetique.available}
                  onClick={() => {
                    if (DOCUMENTS.palmaresPoetique.available) {
                      window.open(DOCUMENTS.palmaresPoetique.path, '_blank');
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                  <span>
                    {DOCUMENTS.palmaresPoetique.available
                      ? DOCUMENTS.palmaresPoetique.label
                      : "Bientôt disponible"}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Palmarès Artistique */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 mb-2">
                <Award className="h-5 w-5 text-artistic-orange" />
                <Badge variant="secondary" className="bg-artistic-orange/10 text-artistic-orange border-artistic-orange/20">
                  Arts Visuels
                </Badge>
              </div>
              <CardTitle className="font-serif-title text-3xl text-primary">
                Palmarès Artistique
              </CardTitle>
              <CardDescription className="font-sans">
                Les lauréats du concours national d'arts visuels
              </CardDescription>
            </CardHeader>
            <CardContent className="font-sans">
              <div className="space-y-4">
                <p className="text-foreground">
                  La SPAF célèbre également les artistes peintres, dessinateurs et photographes à travers son concours artistique national.
                  Explorez les œuvres visuelles qui ont été distinguées cette année.
                </p>
                <Button
                  variant="default"
                  className="flex items-center space-x-2"
                  disabled={!DOCUMENTS.palmaresArtistique.available}
                  onClick={() => {
                    if (DOCUMENTS.palmaresArtistique.available) {
                      window.open(DOCUMENTS.palmaresArtistique.path, '_blank');
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                  <span>
                    {DOCUMENTS.palmaresArtistique.available
                      ? DOCUMENTS.palmaresArtistique.label
                      : "Bientôt disponible"}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Information Card */}
          <Card className="bg-muted/30">
            <CardContent className="p-6">
              <p className="font-sans text-sm text-muted-foreground text-center">
                Pour participer aux prochains concours, consultez nos délégations régionales ou contactez-nous directement.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Concours;
