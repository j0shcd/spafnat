import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Historique = () => {
  const pastPresidents = [
    { name: "Monsieur Henri MEILLANT", period: "1958-1993"},
    { name: "Monsieur Jean-Claude GEORGE", period: "1993-2008"},
    { name: "Monsieur Abraham Vincent VIGILANT", period: "2008-2014"},
    { name: "Monsieur Jean-Jacques CHIRON", period: "2014-2024" },
    { name: "Monsieur Pascal LECORDIER", period: "Depuis 2024" }
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
              Fondation
            </CardTitle>
          </CardHeader>
            <CardContent className="font-sans space-y-4 text-foreground leading-relaxed">
            <p>
              La Société des Poètes et Artistes de France (SPAF) a été créée en 1958 par un groupe
              d'artistes passionnés, unis par la conviction que <em>« l'art est une grande vibration où personne ne dépasse personne »</em>, selon les mots de Jean Cocteau.
            </p>
            <p>
              Depuis plus de 65 ans, notre association fédère poètes, écrivains, artistes, peintres, photographes et musiciens autour d'une passion commune : l'expression artistique sous toutes ses formes.
            </p>
            <p>
              À travers les décennies, la SPAF a organisé des centaines de concours littéraires et artistiques, publié des milliers de textes dans sa revue mensuelle et créé un réseau de délégations régionales qui rayonne sur tout le territoire français
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

            <p>
              Avec l’accueil des artistes, la Société Poétique de France fondée en 1958, prend le nom de Société des 
              Poètes et Artistes de France en 1960 (S.P.A.F.) Le Fondateur est Monsieur RAVARD alias Henry MEILLANT, 
              épaulé par Laure MAUPAS éditeur. Le premier cercle de compagnons comprendra : Hélène VESTIER, Marie-Thérèse 
              Paule POILLERA, Roger BERNIER, tous originaires de l’Est de la France. On y trouvera également Martial 
              GIRY de Lyon; Un peu plus tard Fernande ASSEMAT de Nîmes et Gaby SARAZIN tous aujourd’hui disparus à 
              l’exception de Marcel DUGAST, qui fut Secrétaire à l’Animation culturelle. Cette Société connut un grand 
              succès et beaucoup de personnalités de l’époque y adhérèrent.
            </p>
            <p>
              Son but aujourd’hui est de rassembler les poètes et les artistes de France et des pays francophones dans 
              un esprit d’ouverture et de fraternité, pour les aider et les encourager à perfectionner leurs talents par 
              des actions bénévoles proposées aux adhérents
            </p>
            <p>
              Editer et diffuser les œuvres des poètes et des artistes dans la revue culturelle internationale de la 
              Société, dénommée « Art et Poésie» et dans d’autres publications agréées par la Société.
            </p>
            <p>
              La Société des Poètes et artistes de France se décline en délégations régionales (ou de pays) ayant à 
              sa tête un délégué régional. Hors de France ce sont des délégués généraux qui animent les délégations. 
              Les délégués régionaux et généraux sont nommés par le Président.
            </p>
            <p>
              Un congrès national a lieu chaque année pour récompenser les poètes et les artistes méritants. Ces deux 
              manifestations sont maintenant regroupées à la même date et dans le même lieu. Henry MEILLANT aura été un 
              précurseur de la notion de décentralisation qui a permis de couvrir rapidement le territoire et un grand 
              amoureux de la langue française et de la Poésie. Lui ont succédé au poste de Président Monsieur Jean-Claude 
              GEORGE en 1993. Ce dernier aura su préserver la Société, la faire vivre et rayonner en dépit de l’évolution 
              de la société française par la diversité des loisirs à disposition des citoyens. Beaucoup d’associations 
              amies ont depuis disparu. La SPAF continue sa route sous les auspices d’Abraham Vincent VIGILANT qui s’est 
              donné pour mission d’adapter la Société à son époque pour lui permettre d’épouser son futur et d’accompagner 
              les poètes et les artistes, si nécessaires à l’humanité.
            </p>
            <p>
              En 2014, Monsieur Jean-Jacques CHIRON prend la présidence de la Société des Poètes et Artistes de France.
            </p>
            <p>
              En 2014, Monsieur Jean-Jacques CHIRON prend la présidence de la Société des Poètes et Artistes de France 
              qu’il conduira avec son épouse Christine jusqu’en 2024 alors que la maladie l’emporte. Suite à son décès, 
              Pascal Lecordier est élu à la présidence de la Société pour 6 ans conformément aux statuts.
            </p>
            <p>
              Actuellement, le siège social est situé à la mairie de CHASSENEUIL DU POITOU.
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