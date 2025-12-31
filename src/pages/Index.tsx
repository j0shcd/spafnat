import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Mail, Phone, MapPin, Trophy, BookOpen, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import spafLogo from "@/assets/spaf-logo.png";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message envoyé",
      description: "Votre message a été transmis. Nous vous répondrons rapidement.",
    });
  };

  const activities = [
    {
      title: "Revue",
      description: "Publication de poèmes et d’oeuvres artistiques",
      icon: BookOpen,
      link: "/revue",
      color: "artistic-yellow"
    },
    {
      title: "Concours",
      description: "Concours poétiques et artistiques nationaux et régionaux",
      icon: Trophy,
      action: "Télécharger le formulaire", // add variable number of links, for all regions
      color: "artistic-orange"
    },
    {
      title: "Congrès", 
      description: "Congrès national annuel",
      icon: Users,
      link: "/congres",
      color: "accent"
    },
    {
      title: "Délégations",
      description: "Activités régionales organisées par nos délégations",
      icon: MapPin,
      link: "/delegations",
      color: "secondary"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-background via-muted/20 to-artistic-yellow/10 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <img 
              src={spafLogo} 
              alt="SPAF - Société des Poètes et Artistes de France" 
              className="h-32 w-auto"
            />
          </div>
          
          <h1 className="font-serif-title text-5xl md:text-6xl font-bold text-primary mb-6">
            Société des Poètes et Artistes de France
          </h1>
          
          <div className="w-32 h-1 bg-accent mx-auto mb-8"></div>
          
          <p className="font-serif-title text-xl md:text-2xl text-secondary italic mb-8 max-w-3xl mx-auto leading-relaxed">
            "L&apos;art est une grande vibration où personne ne dépasse personne."
          </p>
          <p className="font-sans text-sm text-muted-foreground mb-8">
            — Jean Cocteau
          </p>
          
          <p className="font-sans text-lg text-foreground max-w-3xl mx-auto leading-relaxed">
            Créée en 1958, la SPAF fédère poètes, écrivains, artistes, peintres, 
            photographes et musiciens autour d&apos;une passion commune : l&apos;expression artistique.
          </p>

          <div className="pt-10 flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-6 mb-6">
            <Button asChild variant="outline">
              <a href="#contact">
                <Mail className="h-4 w-4 mr-2" />
                Nous contacter
              </a>
            </Button>

            <Button asChild variant="outline">
              <a href="/formulaire-adhesion.pdf" download>
                <Download className="h-4 w-4 mr-2" />
                Formulaire d&apos;adhésion (PDF)
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="pt-6 pb-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-serif-title text-3xl font-bold text-primary mb-6">
              Notre communauté en chiffres
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-serif-title font-bold text-accent mb-2">10</div>
                <p className="font-sans text-muted-foreground">Régions représentées</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-serif-title font-bold text-accent mb-2">300+</div>
                <p className="font-sans text-muted-foreground">Membres</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-serif-title font-bold text-accent mb-2">171,000</div>
                <p className="font-sans text-muted-foreground">Visiteurs</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <a 
              href="https://www.facebook.com/groups/1533487767456303/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-sans font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Rejoignez notre groupe Facebook</span>
            </a>
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif-title text-4xl font-bold text-primary mb-4">
              Nos actions
            </h2>
            <div className="w-24 h-1 bg-accent mx-auto mb-6"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {activities.map((activity, index) => {
              const IconComponent = activity.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 group cursor-pointer">
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 rounded-full bg-${activity.color}/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-${activity.color}/20 transition-colors`}>
                      <IconComponent className={`h-8 w-8 text-${activity.color}`} />
                    </div>
                    <CardTitle className="font-serif-title text-xl text-primary">
                      {activity.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="font-sans text-muted-foreground mb-4">
                      {activity.description}
                    </p>
                    {activity.link ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => window.location.href = activity.link}
                      >
                        En savoir plus
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        {activity.action}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Membership Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif-title text-4xl font-bold text-primary mb-4">
              Nous rejoindre
            </h2>
            <div className="w-24 h-1 bg-accent mx-auto mb-6"></div>
          </div>

          <Card className="bg-gradient-to-r from-accent/5 to-artistic-yellow/5 border-accent/20">
            <CardContent className="p-8 md:p-10">
              {/* Header */}
              <div className="text-center mb-8">
                <h3 className="font-serif-title text-2xl md:text-3xl text-primary mb-3">
                  Adhésion SPAF
                </h3>
                <p className="font-sans text-foreground/90 max-w-2xl mx-auto leading-relaxed">
                  Rejoignez une communauté d’artistes en France et dans la francophonie.
                  L’adhésion est requise pour participer aux concours. L’abonnement à la revue
                  ouvre la possibilité de proposer une parution.
                </p>
              </div>

              {/* Main offer */}
              <div className="rounded-2xl border border-accent/25 bg-gradient-to-br from-background to-accent/5 p-6 md:p-7 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-accent/15 text-accent hover:bg-accent/15">
                        Recommandé
                      </Badge>
                      <span className="font-sans text-xs text-muted-foreground">
                        Le plus choisi
                      </span>
                    </div>

                    <h4 className="font-serif-title text-xl md:text-2xl text-primary">
                      Adhésion + abonnement à la revue
                    </h4>

                    <p className="font-sans text-sm text-muted-foreground mt-2 leading-relaxed max-w-xl">
                      Le meilleur équilibre pour participer aux concours et suivre la vie de l’association.
                      <span className="text-foreground/90"> Bonus :</span> pour toute personne abonnée, parution offerte d’un poème ou d’une œuvre
                      (si qualité suffisante).
                    </p>

                    <ul className="mt-4 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
                        <span className="font-sans text-sm text-foreground">
                          Concours réservés aux adhérents
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
                        <span className="font-sans text-sm text-foreground">
                          Revue incluse (abonnement)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
                        <span className="font-sans text-sm text-foreground">
                          Communauté d’artistes en France et dans la francophonie
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="shrink-0 md:text-right">
                    <div className="font-serif-title text-4xl md:text-5xl font-bold text-primary leading-none">
                      40€
                    </div>
                    <div className="font-sans text-xs text-muted-foreground mt-2">
                      par an
                    </div>

                    <div className="mt-5 flex md:justify-end">
                      <Button className="bg-accent hover:bg-accent/90" asChild>
                        <a href="/formulaire-adhesion.pdf" download>
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger le formulaire (PDF)
                        </a>
                      </Button>
                    </div>

                    <div className="mt-3">
                      <Button variant="outline" asChild className="w-full md:w-auto">
                        <a href="#contact">Une question ? Nous contacter</a>
                      </Button>
                    </div>
                  </div>
                </div>

                <p className="font-sans text-xs text-muted-foreground mt-5">
                  Les événements peuvent être payants et font l’objet d’une organisation séparée.
                </p>
              </div>

              {/* Secondary options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="rounded-2xl border bg-background/60 p-5 hover:bg-background transition-colors">
                  <p className="font-serif-title text-lg text-primary">Adhésion</p>
                  <p className="font-sans text-sm text-muted-foreground mt-1">
                    Pour devenir membre (concours).
                  </p>
                  <p className="font-serif-title text-3xl font-bold text-primary mt-4">24€</p>
                  <p className="font-sans text-xs text-muted-foreground mt-1">par an</p>
                </div>

                <div className="rounded-2xl border bg-background/60 p-5 hover:bg-background transition-colors">
                  <p className="font-serif-title text-lg text-primary">Revue (unité)</p>
                  <p className="font-sans text-sm text-muted-foreground mt-1">
                    Acheter un numéro.
                  </p>
                  <p className="font-serif-title text-3xl font-bold text-primary mt-4">12€</p>
                </div>

                <div className="rounded-2xl border bg-background/60 p-5 hover:bg-background transition-colors">
                  <p className="font-serif-title text-lg text-primary">Revue (abonnement)</p>
                  <p className="font-sans text-sm text-muted-foreground mt-1">
                    Sans adhésion.
                  </p>
                  <p className="font-serif-title text-3xl font-bold text-primary mt-4">30€</p>
                  <p className="font-sans text-xs text-muted-foreground mt-1">par an</p>
                </div>
              </div>

              {/* Supporter */}
              <div className="mt-6 rounded-2xl border bg-background/40 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-serif-title text-lg text-primary">Soutenir la SPAF</p>
                    <p className="font-sans text-sm text-muted-foreground">
                      Membre bienfaiteur (adhésion + abonnement + soutien).
                    </p>
                  </div>
                  <div className="font-serif-title text-2xl font-bold text-primary">50€</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 px-4 bg-background scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif-title text-4xl font-bold text-primary mb-4">
              Contact
            </h2>
            <div className="w-24 h-1 bg-accent mx-auto mb-6"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif-title text-2xl text-primary">
                  Nous écrire
                </CardTitle>
                <CardDescription className="font-sans">
                  Une question ? Un projet ? N&apos;hésitez pas à nous contacter.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-sans">Nom complet</Label>
                    <Input id="name" placeholder="Votre nom" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-sans">Email</Label>
                    <Input id="email" type="email" placeholder="votre@email.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="font-sans">Sujet</Label>
                    <Input id="subject" placeholder="Sujet de votre message" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="font-sans">Message</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Votre message..." 
                      rows={5}
                      required 
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Envoyer le message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif-title text-2xl text-primary">
                    Président actuel
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-sans font-semibold text-foreground">François Girard</h4>
                    <p className="font-sans text-muted-foreground">Président de la SPAF</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-accent" />
                      <span className="font-sans text-sm">president@spafnat.com</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-accent" />
                      <span className="font-sans text-sm">05 49 52 35 85</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-4 w-4 text-accent mt-1" />
                      <div className="font-sans text-sm">
                        <p>12 rue des Lilas</p>
                        <p>86360 Chasseneuil-du-Poitou</p>
                        <p>France</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-6">
                  <h4 className="font-serif-title text-lg font-semibold mb-3">
                    Siège social
                  </h4>
                  <div className="space-y-2 font-sans text-sm">
                    <p>Mairie de Chasseneuil du Poitou</p>
                    <p>1 Place de la Mairie</p>
                    <p>86360 Chasseneuil-du-Poitou</p>
                    <p>France</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
