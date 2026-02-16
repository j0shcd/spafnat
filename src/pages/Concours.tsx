import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ChevronDown, ChevronUp } from "lucide-react";
import { useConcours, type ConcoursItem } from "@/hooks/useConcours";
import { CONCOURS_CATEGORIES } from "@/config/concours";

const Concours = () => {
  const { data, isLoading, error } = useConcours();
  const [poetiqueExpanded, setPoetiqueExpanded] = useState(false);
  const [artistiqueExpanded, setArtistiqueExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-destructive">Erreur : {error}</p>
        </div>
      </div>
    );
  }

  const reglements = data?.reglements || [];
  const palmaresPoetique = data?.['palmares-poetique'] || [];
  const palmaresArtistique = data?.['palmares-artistique'] || [];

  const renderDownloadButton = (item: ConcoursItem, showPrimary = false, isPalmares = false) => (
    <Button
      key={item.r2Key}
      variant={showPrimary ? "default" : "outline"}
      className={`flex items-center space-x-2 ${
        showPrimary || isPalmares
          ? "bg-primary hover:bg-primary/90 text-primary-foreground border-primary"
          : ""
      }`}
      onClick={() => window.open(`/api/media/${item.r2Key}`, '_blank')}
    >
      <Download className="h-4 w-4" />
      <span>{item.title}</span>
    </Button>
  );

  const renderPalmaresSection = (
    title: string,
    description: string,
    items: ConcoursItem[],
    expanded: boolean,
    setExpanded: (value: boolean) => void
  ) => {
    const latest = items[0];
    const previous = items.slice(1);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif-title text-3xl text-primary">
            {title}
          </CardTitle>
          <CardDescription className="font-sans">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="font-sans">
          {items.length === 0 ? (
            <p className="text-muted-foreground">Bientôt disponible</p>
          ) : (
            <div className="space-y-4">
              {/* Latest palmares */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Dernier palmarès
                </p>
                {renderDownloadButton(latest, true, true)}
              </div>

              {/* Previous palmares (collapsible) */}
              {previous.length > 0 && (
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-between"
                    onClick={() => setExpanded(!expanded)}
                  >
                    <span className="text-sm font-medium">
                      Palmarès précédents ({previous.length})
                    </span>
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>

                  {expanded && (
                    <div className="flex flex-col gap-2 pl-4">
                      {previous.map(item => renderDownloadButton(item, false, true))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

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
            Découvrez les règlements et lauréats de nos concours poétiques et artistiques nationaux
          </p>
        </header>

        {/* Concours Sections */}
        <div className="space-y-8">
          {/* Règlements Section */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif-title text-3xl text-primary">
                {CONCOURS_CATEGORIES.reglements.label}
              </CardTitle>
              <CardDescription className="font-sans">
                {CONCOURS_CATEGORIES.reglements.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="font-sans">
              {reglements.length === 0 ? (
                <p className="text-muted-foreground">Bientôt disponible</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {reglements.map(item => renderDownloadButton(item))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Palmarès Poétique */}
          {renderPalmaresSection(
            "Grands Prix de Poésie",
            "Les lauréats du concours national de poésie",
            palmaresPoetique,
            poetiqueExpanded,
            setPoetiqueExpanded
          )}

          {/* Palmarès Artistique */}
          {renderPalmaresSection(
            "Grands Prix Artistiques",
            "Les lauréats du concours national d'arts visuels",
            palmaresArtistique,
            artistiqueExpanded,
            setArtistiqueExpanded
          )}

          {/* Information Card
          <Card className="bg-muted/30">
            <CardContent className="p-6">
              <p className="font-sans text-sm text-muted-foreground text-center">
                Pour participer aux prochains concours, consultez nos délégations régionales ou contactez-nous directement.
              </p>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
  );
};

export default Concours;
