import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, BookOpen, Users } from "lucide-react";
import { DOCUMENTS } from "@/config/documents";
import { useDocumentUrl } from "@/hooks/useDocumentUrl";
import { PdfCover } from "@/components/PdfCover";

const Revue = () => {
  // Get R2-aware URL for document
  const { url: extraitUrl, isAvailable: extraitAvailable, originalFilename } = useDocumentUrl('extraitRevue');

  // Derive title from original filename or use fallback
  const revueTitle = originalFilename
    ? originalFilename.replace(/\.pdf$/i, '')
    : "Extrait de la Revue";
  const contributors = [
    "Fernand GREGH, de l'Académie Française",
    "Pierre BENOIT",
    "Charles Le QUINTREC",
    "Maurice FOMBEUR",
    "Marcel BEALU",
    "Pierre BEARN",
    "André SALMON",
    "Sylvain France",
    "Hervé",
    "Pierre SEGHERS",
    "Paul FORT",
    "BAZIN de l’Académie française",
    "Jean ROUSSELOT",
    "Paul GILSON",
    "Patrice DE LA TOUR DU PIN",
    "Luc BERIMON",
    "François DIDELOT",
    "Michel BUTOR",
    "Philéas LEBESQUE",
    "Philippe CHABANEX",
    "Yves TARLET",
    "Yanette DELETANG-TARDIF",
    "Armand LANOUX",
    "André ASSELIN",
    "Wilfrid LUCAS",
    "Jean BRETON",
    "R. de OBALDIA",
    "Pierre GROSCLAUDE",
    "Mireio DORYAN",
    "Hélène VESTIER",
    "Gaston BOURGEOIS",
    "Daniel ROPS de l’Académie Française",
    "M-Th POILLERA",
    "Georges DELAMARE",
    "Marc CHESNEAU",
    "Andrée BOURCOIS-MACE",
    "Pierre DEBOISDEFFRE",
    "René DORIN",
    "Pierre AUTIZE",
    "GUILLOT DEN SAI",
    "André BERRY",
    "Françoise DORIN",
    "Andrée RODENBACH",
    "Armand GOT",
    "Katia GRANOFF",
    "André MAUROIS de l’Académie Française",
    "Jules ROMAIN de l’Académie Française",
    "Daniel GELIN",
    "Paul GERALDY",
    "Paul GUTH",
    "J-P ROSNAY",
    "Renée DAUMIERE",
    "André BLANCHARD",
    "Michel de SAINT-PIERRE",
    "Marc ALYN",
    "Henri de LESCOET",
    "Léopold S. SENGHOR",
    "Roger DENUX",
    "Marcel FARGES",
    "Lamine DIAKATE",
    "Roland LECORDIER",
    "Pierre Marc ORLAN de l’Académie Goncourt",
    "Maurice TOESCA",
    "Bernard ANDRE",
    "Maurice d’HARTOIS",
    "Bogomir DALMA",
    "Jean DAWEL",
    "Jean GIONO",
    "Louis AMADE",
    "Georges RIGUET",
    "René VIOLAINES",
    "Pierre LYAUTE",
    "J-L BECHU",
    "Maurice GAUCHEZ",
    "Tristan MAYA",
    "Noël H. VILLARD",
    "Georges GUERIN",
    "MARJAN",
    "André HENRY",
    "Maurice CARËME",
    "Roger FERDINAND",
    "Alain DEBROISE",
    "Géo LIBRECHT",
    "Jean CASSOU",
    "Claude VAILLANT",
    "Odette CASADESUS",
    "Roger BERNIER",
    "Maurice COURANT",
    "Jacques LAPAGE",
    "Marcel PAGNOL de l’Académie française",
    "Ch. BORY",
    "René HERVAL",
    "Louis-Thomas JURDAN",
    "Anthony LHERITIER",
    "Maurice GENEVOIX, Secrétaire perpétuel de l’Académie Française",
    "René FAUCHOIS",
    "Jacqueline DELPY",
    "Jean L’Anselme",
    "Louis ARAGON",
    "Henry MEILLANT",
    "Jean-Michel RENAITOUR",
    "Marie NOEL",
    "Laure Maupas",
    "Jean SALVAYRE",
    "M-A ASTURIAS",
    "Claude LUEZIOR",
    "Henry BORDEAUX de l’Académie Française",
    "Jean ROSTAND de l’Académie Française",
    "Jean-Claude GEORGE",
    "Tristan KLINGSOR",
    "Jean GUIREC",
    "Patrick POIVRE D’ARVOR"
  ].sort();

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <header className="text-center mb-12">
          <h1 className="font-serif-title text-4xl md:text-5xl font-bold text-primary mb-4">
            Notre Revue
          </h1>
          <div className="w-24 h-1 bg-accent mx-auto mb-6"></div>
        </header>

        {/* Current Issue */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Magazine Cover */}
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              {extraitAvailable ? (
                <PdfCover
                  url={extraitUrl}
                  alt={revueTitle}
                  className="w-full"
                />
              ) : (
                <div className="aspect-[3/4] bg-gradient-to-br from-primary via-secondary to-accent relative flex items-center justify-center rounded-lg shadow-xl">
                  <div className="text-center text-primary-foreground p-8">
                    <h3 className="font-serif-title text-3xl font-bold mb-4">
                      SPAF REVUE
                    </h3>
                    <p className="font-sans text-lg mb-2">Bientôt disponible</p>
                  </div>
                </div>
              )}
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
                  {revueTitle}
                </CardTitle>
                <CardDescription className="font-sans">
                  Revue internationale de culture française
                </CardDescription>
              </CardHeader>
              <CardContent className="font-sans space-y-4">
                <div className="flex space-x-3">
                  <Button
                    variant="default"
                    className="flex items-center space-x-2"
                    disabled={!extraitAvailable}
                    onClick={() => {
                      if (extraitAvailable) {
                        window.open(extraitUrl, '_blank');
                      }
                    }}
                  >
                    <Download className="h-4 w-4" />
                    <span>
                      {extraitAvailable
                        ? "Télécharger l'extrait"
                        : "Bientôt disponible"}
                    </span>
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
                  Recevez trois fois par an votre revue directement chez vous.
                </p>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Abonnement annuel :</strong> 33€ (3 revues)
                  </p>
                  <p className="text-sm">
                    <strong>Abonnement et adhésion :</strong> 40€ (3 revues)
                  </p>
                  <p className="text-sm">
                    <strong> Le numéro <span className="text-muted-foreground">( + 5€ frais d'envoi )</span> :</strong> 12€
                  </p>
                </div>
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
              Nos Contributeurs
            </CardTitle>
            <CardDescription className="font-sans">
              Quelques-unes des plumes qui ont enrichi nos pages au fil des années
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
              {contributors.map((name, index) => (
                <div key={index} className="font-sans text-foreground py-1">
                  {name}
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