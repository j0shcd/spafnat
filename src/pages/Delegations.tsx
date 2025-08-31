import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Mail, Phone, Users } from "lucide-react";

const Delegations = () => {
  const delegations = [
    {
      region: "Île-de-France",
      delegate: "Marie Dubois",
      city: "Paris",
      email: "idf@spafnat.com",
      phone: "01 42 33 44 55",
      members: 156,
      description: "Siège historique de l'association, organise des lectures mensuelles à la Sorbonne."
    },
    {
      region: "Auvergne-Rhône-Alpes",
      delegate: "Jean Moreau",
      city: "Lyon",
      email: "aura@spafnat.com",
      phone: "04 78 90 12 34",
      members: 89,
      description: "Active dans l'organisation d'ateliers d'écriture et de concours régionaux."
    },
    {
      region: "Nouvelle-Aquitaine",
      delegate: "Sophie Martin",
      city: "Bordeaux",
      email: "na@spafnat.com",
      phone: "05 56 78 90 12",
      members: 67,
      description: "Spécialisée dans la poésie occitane et les traditions littéraires régionales."
    },
    {
      region: "Occitanie",
      delegate: "Pierre Rousseau",
      city: "Toulouse",
      email: "occitanie@spafnat.com",
      phone: "05 61 23 45 67",
      members: 72,
      description: "Forte tradition de troubadours, organise le Festival de Poésie de Printemps."
    },
    {
      region: "Provence-Alpes-Côte d'Azur",
      delegate: "Isabelle Lefort",
      city: "Marseille",
      email: "paca@spafnat.com",
      phone: "04 91 34 56 78",
      members: 85,
      description: "Collabore étroitement avec les festivals de Cannes et d'Avignon."
    },
    {
      region: "Grand Est",
      delegate: "Michel Girard",
      city: "Strasbourg",
      email: "grandest@spafnat.com",
      phone: "03 88 45 67 89",
      members: 54,
      description: "Promotion de la poésie bilingue français-allemand et des échanges européens."
    },
    {
      region: "Hauts-de-France",
      delegate: "Catherine Blanc",
      city: "Lille",
      email: "hdf@spafnat.com",
      phone: "03 20 56 78 90",
      members: 43,
      description: "Organise des rencontres avec les poètes belges et néerlandais."
    },
    {
      region: "Normandie",
      delegate: "François Petit",
      city: "Rouen",
      email: "normandie@spafnat.com",
      phone: "02 35 67 89 01",
      members: 38,
      description: "Préservation du patrimoine littéraire normand, terre de Corneille et Flaubert."
    },
    {
      region: "Pays de la Loire",
      delegate: "Anne Durand",
      city: "Nantes",
      email: "pdl@spafnat.com",
      phone: "02 40 78 90 12",
      members: 45,
      description: "Organisation de résidences d'artistes et de masterclasses d'écriture."
    },
    {
      region: "Bretagne",
      delegate: "Yann Le Gall",
      city: "Rennes",
      email: "bretagne@spafnat.com",
      phone: "02 99 89 01 23",
      members: 52,
      description: "Valorisation de la tradition bardique bretonne et de la poésie contemporaine."
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
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-accent" />
                    <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                      {delegation.region}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-sans text-sm text-muted-foreground">
                      {delegation.members} membres
                    </span>
                  </div>
                </div>
                <CardTitle className="font-serif-title text-xl text-primary">
                  {delegation.city}
                </CardTitle>
                <CardDescription className="font-sans text-foreground">
                  Délégué·e : <strong>{delegation.delegate}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  {delegation.description}
                </p>
                
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-accent" />
                    <a 
                      href={`mailto:${delegation.email}`}
                      className="font-sans text-foreground hover:text-accent transition-colors"
                    >
                      {delegation.email}
                    </a>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-accent" />
                    <span className="font-sans text-foreground">
                      {delegation.phone}
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
                href="mailto:delegations@spafnat.com"
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