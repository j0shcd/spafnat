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
      title: "Revues mensuelles",
      description: "Publication mensuelle de poésies et d'articles artistiques",
      icon: BookOpen,
      link: "/revue",
      color: "artistic-yellow"
    },
    {
      title: "Concours",
      description: "Concours littéraires et artistiques nationaux",
      icon: Trophy,
      action: "Télécharger le formulaire",
      color: "artistic-orange"
    },
    {
      title: "Évènements nationaux", 
      description: "Congrès annuel et événements d'envergure",
      icon: Users,
      link: "/congres",
      color: "accent"
    },
    {
      title: "Évènements départementaux",
      description: "Activités locales organisées par nos délégations",
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
            "L'art est une grande vibration où personne ne dépasse personne."
          </p>
          <p className="font-sans text-sm text-muted-foreground mb-8">
            — Jean Cocteau
          </p>
          
          <p className="font-sans text-lg text-foreground max-w-3xl mx-auto leading-relaxed">
            Créée en 1958, la SPAF fédère poètes, écrivains, artistes, peintres, 
            photographes et musiciens autour d'une passion commune : l'expression artistique.
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
      <section className="pt-10 pb-16 px-4 bg-muted/30">
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
              href="https://facebook.com/groups/spafnat" 
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
              Nos Actions
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
              Nous Rejoindre
            </h2>
            <div className="w-24 h-1 bg-accent mx-auto mb-6"></div>
          </div>

          <Card className="bg-gradient-to-r from-accent/5 to-artistic-yellow/5 border-accent/20">
            <CardContent className="p-8 text-center">
              <h3 className="font-serif-title text-2xl text-primary mb-4">
                Adhésion SPAF 2025
              </h3>
              <p className="font-sans text-foreground mb-6 max-w-2xl mx-auto">
                Rejoignez notre communauté d'artistes et participez à la vie culturelle française. 
                L'adhésion vous donne accès à tous nos concours, événements et à notre revue mensuelle.
              </p>
              <div className="space-y-2 mb-6">
                <p className="font-sans"><strong>Cotisation annuelle :</strong> 35€</p>
                <p className="font-sans"><strong>Cotisation de soutien :</strong> 50€</p>
              </div>
              <Button className="bg-accent hover:bg-accent/90">
                <Download className="h-4 w-4 mr-2" />
                Formulaire d'adhésion (PDF)
              </Button>
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
                  Une question ? Un projet ? N'hésitez pas à nous contacter.
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
