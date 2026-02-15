import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Download, Calendar, MapPin, ChevronLeft, ChevronRight, X, Image as ImageIcon } from "lucide-react";
import { DOCUMENTS } from "@/config/documents";

const Congres = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

  // Generate years from 2010 to 2026
  const years = Array.from({ length: 17 }, (_, i) => 2026 - i);

  // Placeholder photos for each year (empty for now)
  const photosByYear: Record<number, string[]> = {};

  const currentYearPhotos = photosByYear[selectedYear] || [];

  const handlePrevPhoto = () => {
    if (selectedPhoto !== null && selectedPhoto > 0) {
      setSelectedPhoto(selectedPhoto - 1);
    }
  };

  const handleNextPhoto = () => {
    if (selectedPhoto !== null && selectedPhoto < currentYearPhotos.length - 1) {
      setSelectedPhoto(selectedPhoto + 1);
    }
  };

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
            L'événement annuel qui rassemble les poètes et artistes de France
          </p>
        </header>

        {/* Next Congress Event Card - MOVED TO TOP */}
        <Card className="mb-12 bg-gradient-to-r from-accent/10 to-artistic-yellow/10 border-accent/30">
          <CardHeader>
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="h-5 w-5 text-accent" />
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                Prochain événement
              </Badge>
            </div>
            <CardTitle className="font-serif-title text-3xl text-primary">
              Congrès National 2026
            </CardTitle>
            <CardDescription className="font-sans text-lg">
              L&apos;événement phare de l&apos;année artistique française
            </CardDescription>
          </CardHeader>
          <CardContent className="font-sans space-y-4">
            <div className="flex items-center space-x-2 text-foreground">
              <MapPin className="h-4 w-4 text-accent" />
              <span className="font-medium">Villers-sur-Mer</span>
            </div>
            <div className="flex items-center space-x-2 text-foreground">
              <Calendar className="h-4 w-4 text-accent" />
              <span className="font-medium">26 Septembre 2026</span>
            </div>
            <p className="text-muted-foreground">
              Plus d&apos;information à venir !
            </p>

            {/* Registration Download Button */}
            <Button
              variant="default"
              className="bg-accent hover:bg-accent/90 text-accent-foreground flex items-center space-x-2"
              disabled={!DOCUMENTS.inscriptionCongres.available}
              onClick={() => {
                if (DOCUMENTS.inscriptionCongres.available) {
                  window.open(DOCUMENTS.inscriptionCongres.path, '_blank');
                }
              }}
            >
              <Download className="h-4 w-4" />
              <span>
                {DOCUMENTS.inscriptionCongres.available
                  ? DOCUMENTS.inscriptionCongres.label
                  : "Inscription - Bientôt disponible"}
              </span>
            </Button>
          </CardContent>
        </Card>

        {/* Photo Gallery Section */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif-title text-3xl text-primary">
              Galerie des Congrès
            </CardTitle>
            <CardDescription className="font-sans">
              Revivez les moments forts de nos événements nationaux de 2010 à 2026
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Year Selector */}
            <div className="mb-6">
              <h3 className="font-sans font-semibold text-foreground mb-3">Sélectionner une année</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2">
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`
                      px-4 py-2 rounded-lg font-sans font-medium transition-all
                      ${selectedYear === year
                        ? 'bg-accent text-accent-foreground shadow-md scale-105'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }
                    `}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Grid */}
            <div className="mt-6">
              {currentYearPhotos.length === 0 ? (
                // Placeholder state
                <div className="py-16 text-center bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                  <ImageIcon className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
                  <h4 className="font-serif-title text-xl text-muted-foreground mb-2">
                    Photos à venir
                  </h4>
                  <p className="font-sans text-sm text-muted-foreground">
                    Les photos du Congrès {selectedYear} seront bientôt disponibles
                  </p>
                </div>
              ) : (
                // Photo grid (when photos are available)
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {currentYearPhotos.map((photo, index) => (
                    <Dialog key={index}>
                      <DialogTrigger asChild>
                        <button
                          onClick={() => setSelectedPhoto(index)}
                          className="relative group aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
                        >
                          <img
                            src={photo}
                            alt={`Congrès ${selectedYear} - Photo ${index + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          />
                          {/* Download icon overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <Download className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <div className="relative">
                          {/* Close button */}
                          <button
                            onClick={() => setSelectedPhoto(null)}
                            className="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                          >
                            <X className="h-5 w-5" />
                          </button>

                          {/* Main image */}
                          <img
                            src={currentYearPhotos[selectedPhoto || 0]}
                            alt={`Congrès ${selectedYear} - Photo ${(selectedPhoto || 0) + 1}`}
                            className="w-full h-auto rounded-lg"
                          />

                          {/* Navigation and download controls */}
                          <div className="flex items-center justify-between mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handlePrevPhoto}
                              disabled={selectedPhoto === 0}
                            >
                              <ChevronLeft className="h-4 w-4 mr-1" />
                              Précédent
                            </Button>

                            <span className="font-sans text-sm text-muted-foreground">
                              {(selectedPhoto || 0) + 1} / {currentYearPhotos.length}
                            </span>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleNextPhoto}
                              disabled={selectedPhoto === currentYearPhotos.length - 1}
                            >
                              Suivant
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>

                          {/* Download button */}
                          <Button
                            variant="default"
                            className="w-full mt-2"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = currentYearPhotos[selectedPhoto || 0];
                              link.download = `congres_${selectedYear}_${(selectedPhoto || 0) + 1}.jpg`;
                              link.click();
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger la photo
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Congres;
