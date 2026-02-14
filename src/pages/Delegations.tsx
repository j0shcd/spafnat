import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const Delegations = () => {
const delegations = [
    {
      region: "Auvergne-Rhône-Alpes",
      delegate: "Gael Schmidt",
      address: "64 route de la vieille églises, 74410 Saint-Jorioz",
    },
    {
      region: "Bourgogne-Franche-Comté",
      delegate: "Michel Potier",
      address: "33 rue de Compostelle, Villiers-le-Sec, 58210 Varzy",
    },
    {
      region: "Bretagne",
      delegate: "Loriane Dréan",
      address: "31 Hent Toull Moger, 29000 Quimper",
    },
    {
      region: "Grand Est",
      delegate: "Christine Golleau-Braibant",
      address: "8 rue du Maréchal Foch, 57220 Boulay",
    },
    {
      region: "Île-de-France",
      delegate: "Magali Breton",
      address: "12 Chemin des Boissettes, 77350 Boissise la Bertrand",
    },
    {
      region: "Martinique - Guadeloupe",
      delegate: "Arlette Millon",
      address: "Quartier Lamberton, 97215 Rivière Salée",
    },
    {
      region: "Mascareignes",
      delegate: "Thierry Bertil",
      address: "312 rue Raphaël Douyere Bois-court, 97418 Plaine des Cafres",
    },
    {
      region: "Normandie",
      delegate: "Philippe Pauthonier",
      address: "13 rue de la Mailleray, Rés. de France Imm. Roussillon, 76600 Le Havre"
    },
    {
      region: "Nouvelle Aquitaine",
      delegate: "Christian Littée",
      address: "13 rue des Carmes appt. 14 allée du bon pasteur, 86000 Poitiers",
    },
    {
      region: "Occitanie",
      delegate: "Richard Maggiore",
      address: "9 rue Desmazels Appt 7, 82200 Moissac",
    },
    {
      region: "Provence-Alpes-Côte d'Azur",
      delegate: "Natalie Lauro",
      address: "64 Avenue du 3 septembre, La Lézardière Bat G, 06320 Cap d'ail",
    }
  ];

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <header className="text-center mb-12">
          <h1 className="font-serif-title text-4xl md:text-5xl font-bold text-primary mb-4">
            Délégations Régionales
          </h1>
          <div className="w-24 h-1 bg-accent mx-auto mb-6"></div>
          <p className="font-sans text-lg text-muted-foreground max-w-3xl mx-auto">
            Découvrez nos représentants dans toute la France et rejoignez la communauté SPAF près de chez vous
          </p>
        </header>

        {/* Introduction */}
        <Card className="mb-12 bg-gradient-to-r from-artistic-yellow/5 to-artistic-orange/5 border-artistic-yellow/20">
          <CardContent className="p-8">
            <div className="text-center">
              <h2 className="font-serif-title text-2xl text-primary mb-4">
                Un Réseau National Dynamique
              </h2>
              <p className="font-sans text-foreground leading-relaxed max-w-4xl mx-auto">
                Nos délégations régionales sont le cœur battant de la SPAF sur le territoire. 
                Chaque délégation organise des événements locaux, anime des ateliers d'écriture, 
                et maintient le lien entre les artistes de sa région. Elles constituent un réseau 
                de plus de 700 membres actifs à travers la France.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Delegations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {delegations.map((delegation, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="font-serif-title text-2xl text-primary">
                    {delegation.region}
                  </CardTitle>
                </div>
                <CardDescription className="font-sans text-foreground">
                  Délégué·e : <strong>{delegation.delegate}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-accent" />
                    <span className="font-sans text-foreground">
                      {delegation.address}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact CTA */}
        <Card className="mt-12 text-center bg-primary text-primary-foreground">
          <CardContent className="p-8">
            <h3 className="font-serif-title text-2xl font-semibold mb-4">
              Votre région ne figure pas dans cette liste ?
            </h3>
            <p className="font-sans mb-6 opacity-90 max-w-2xl mx-auto">
              Nous sommes toujours à la recherche de nouveaux délégués régionaux 
              pour étendre notre réseau. Contactez-nous si vous souhaitez représenter 
              la SPAF dans votre région.
            </p>
            <div className="space-x-4">
              <a 
                href="mailto:jcohendumani7@gmail.com"
                className="inline-block bg-artistic-yellow text-primary px-6 py-3 rounded-lg font-sans font-medium hover:bg-artistic-yellow/90 transition-colors"
              >
                Devenir délégué·e
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Delegations;