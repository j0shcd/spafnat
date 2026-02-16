import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Download, Calendar, MapPin, ChevronLeft, ChevronRight, X, Image as ImageIcon } from "lucide-react";
import { DOCUMENTS } from "@/config/documents";
import { useDocumentUrl } from "@/hooks/useDocumentUrl";

interface Photo {
  key: string;
  filename: string;
  url: string;
  lastModified: string;
  size: number;
}

const Congres = () => {
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [isLoadingYears, setIsLoadingYears] = useState(true);

  // Get R2-aware URL for inscription document
  const { url: inscriptionUrl, isAvailable: inscriptionAvailable } = useDocumentUrl('inscriptionCongres');

  // Fetch available years on mount
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await fetch('/api/gallery/years');
        if (response.ok) {
          const data = await response.json();
          const years = data.years || [];
          setAvailableYears(years);
          // Set default to most recent year, or null if no years
          if (years.length > 0) {
            setSelectedYear(years[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch available years:', error);
      } finally {
        setIsLoadingYears(false);
      }
    };

    fetchYears();
  }, []);

  // Fetch photos when selectedYear changes
  useEffect(() => {
    if (selectedYear === null) return;

    const fetchPhotos = async () => {
      setIsLoadingPhotos(true);
      try {
        const response = await fetch(`/api/gallery?year=${selectedYear}`);
        if (response.ok) {
          const data = await response.json();
          setPhotos(data.photos || []);
        } else {
          setPhotos([]);
        }
      } catch (error) {
        console.error('Failed to fetch photos:', error);
        setPhotos([]);
      } finally {
        setIsLoadingPhotos(false);
      }
    };

    fetchPhotos();
  }, [selectedYear]);

  const currentYearPhotos = photos;

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

            {/* Registration Download Button */}
            <Button
              variant="default"
              className="bg-accent hover:bg-accent/90 text-accent-foreground flex items-center space-x-2"
              disabled={!inscriptionAvailable}
              onClick={() => {
                if (inscriptionAvailable) {
                  window.open(inscriptionUrl, '_blank');
                }
              }}
            >
              <Download className="h-4 w-4" />
              <span>
                {inscriptionAvailable
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
              Revivez les moments forts de nos événements nationaux
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingYears ? (
              // Loading years
              <div className="py-16 text-center bg-muted/30 rounded-lg">
                <ImageIcon className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4 animate-pulse" />
                <p className="font-sans text-sm text-muted-foreground">
                  Chargement...
                </p>
              </div>
            ) : availableYears.length === 0 ? (
              // No years with photos
              <div className="py-16 text-center bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                <ImageIcon className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
                <h4 className="font-serif-title text-xl text-muted-foreground mb-2">
                  Photos à venir
                </h4>
                <p className="font-sans text-sm text-muted-foreground">
                  Les photos des congrès seront bientôt disponibles
                </p>
              </div>
            ) : (
              <>
                {/* Year Selector */}
                <div className="mb-6">
                  <h3 className="font-sans font-semibold text-foreground mb-3">Sélectionner une année</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {availableYears.map((year) => (
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
                  {isLoadingPhotos ? (
                    // Loading photos
                    <div className="py-16 text-center bg-muted/30 rounded-lg">
                      <ImageIcon className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4 animate-pulse" />
                      <p className="font-sans text-sm text-muted-foreground">
                        Chargement des photos...
                      </p>
                    </div>
                  ) : (
                // Photo grid (when photos are available)
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {currentYearPhotos.map((photo, index) => (
                    <Dialog key={photo.key}>
                      <DialogTrigger asChild>
                        <button
                          onClick={() => setSelectedPhoto(index)}
                          className="relative group aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
                        >
                          <img
                            src={photo.url}
                            alt={`Congrès ${selectedYear} - Photo ${index + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          />
                          {/* Download icon overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <Download className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl p-6">
                        <div className="flex flex-col items-center">
                          {/* Main image - fixed height container to prevent layout shifts */}
                          <div className="w-full h-[70vh] flex items-center justify-center mb-4">
                            <img
                              src={currentYearPhotos[selectedPhoto || 0]?.url}
                              alt={`Congrès ${selectedYear} - Photo ${(selectedPhoto || 0) + 1}`}
                              className="max-w-full max-h-full object-contain rounded-lg"
                            />
                          </div>

                          {/* Navigation and download controls - fixed position */}
                          <div className="flex items-center justify-between w-full gap-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handlePrevPhoto}
                              disabled={selectedPhoto === 0}
                              className="min-w-[100px]"
                            >
                              <ChevronLeft className="h-4 w-4 mr-1" />
                              Précédent
                            </Button>

                            <span className="font-sans text-sm text-muted-foreground whitespace-nowrap">
                              {(selectedPhoto || 0) + 1} / {currentYearPhotos.length}
                            </span>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleNextPhoto}
                              disabled={selectedPhoto === currentYearPhotos.length - 1}
                              className="min-w-[100px]"
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
                              const currentPhoto = currentYearPhotos[selectedPhoto || 0];
                              const link = document.createElement('a');
                              link.href = currentPhoto.url;
                              link.download = currentPhoto.filename;
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Congres;
