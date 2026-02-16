import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { DOCUMENTS } from "@/config/documents";
import { useDocumentUrl } from "@/hooks/useDocumentUrl";

const Concours = () => {
  // Get R2-aware URLs for documents
  const { url: palmarespoetiqueUrl, isAvailable: palmarespoetiqueAvailable } = useDocumentUrl('palmaresPoetique');
  const { url: palmaresArtistiqueUrl, isAvailable: palmaresArtistiqueAvailable } = useDocumentUrl('palmaresArtistique');
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
            Découvrez les règlements etlauréats de nos concours poétiques et artistiques nationaux
          </p>
        </header>

        {/* Concours Sections */}
        <div className="space-y-8">
          {/* Palmarès Poétique */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif-title text-3xl text-primary">
                Grands Prix de Poésie
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
                  className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={!palmarespoetiqueAvailable}
                  onClick={() => {
                    if (palmarespoetiqueAvailable) {
                      window.open(palmarespoetiqueUrl, '_blank');
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                  <span>
                    {palmarespoetiqueAvailable
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
              <CardTitle className="font-serif-title text-3xl text-primary">
                Grands Prix Artistiques
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
                  className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={!palmaresArtistiqueAvailable}
                  onClick={() => {
                    if (palmaresArtistiqueAvailable) {
                      window.open(palmaresArtistiqueUrl, '_blank');
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                  <span>
                    {palmaresArtistiqueAvailable
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
