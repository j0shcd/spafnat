import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Historique = () => {
  const pastPresidents = [
    { name: "Jean Dubois", period: "1958-1965", description: "Fondateur de l'association" },
    { name: "Marie Delacroix", period: "1965-1972", description: "Développement des délégations régionales" },
    { name: "Pierre Moreau", period: "1972-1985", description: "Création de la revue mensuelle" },
    { name: "Catherine Rousseau", period: "1985-1998", description: "Expansion internationale" },
    { name: "Michel Lefort", period: "1998-2010", description: "Modernisation et numérique" },
    { name: "Isabelle Martin", period: "2010-2020", description: "Rayonnement culturel national" },
    { name: "François Girard", period: "2020-présent", description: "Président actuel" },
  ];

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <header className="text-center mb-12">
          <h1 className="font-serif-title text-4xl md:text-5xl font-bold text-primary mb-4">
            Notre Histoire
          </h1>
          <div className="w-24 h-1 bg-accent mx-auto mb-6"></div>
          <p className="font-sans text-lg text-muted-foreground max-w-3xl mx-auto">
            Découvrez l'évolution de notre association depuis sa création en 1958
          </p>
        </header>

        {/* Historical Description */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="font-serif-title text-2xl text-primary">
              Fondation et Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="font-sans space-y-4 text-foreground leading-relaxed">
            <p>
              La Société des Poètes et Artistes de France (SPAF) a été créée en 1958 par un groupe 
              d'artistes passionnés, unis par la conviction que <em>"l'art est une grande vibration 
              où personne ne dépasse personne"</em> selon les mots de Jean Cocteau.
            </p>
            <p>
              Depuis plus de 65 ans, notre association fédère poètes, écrivains, artistes, peintres, 
              photographes et musiciens autour d'une passion commune : l'expression artistique sous 
              toutes ses formes.
            </p>
            <p>
              À travers les décennies, la SPAF a organisé des centaines de concours littéraires et 
              artistiques, publié des milliers de textes dans sa revue mensuelle, et créé un réseau 
              de délégations régionales qui rayonne sur tout le territoire français et au-delà.
            </p>
            <p>
              Notre mission demeure inchangée : promouvoir la création artistique, encourager les 
              talents émergents, et maintenir vivante la tradition poétique française tout en 
              s'ouvrant aux expressions contemporaines.
            </p>
          </CardContent>
        </Card>

        {/* Past Presidents */}
        <section>
          <h2 className="font-serif-title text-3xl font-semibold text-primary mb-8 text-center">
            Nos Présidents
          </h2>
          
          <Card>
            <CardContent className="p-8">
              <div className="space-y-3">
                {pastPresidents.map((president, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-muted last:border-0">
                    <span className="font-serif-title text-lg text-primary font-medium">
                      {president.name}
                    </span>
                    <span className="font-sans text-muted-foreground">
                      {president.period}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Historique;