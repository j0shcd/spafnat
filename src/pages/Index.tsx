import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Mail, MapPin, Trophy, BookOpen, Users, FileText } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import spafLogo from "@/assets/spaf-logo.png";
import { DOCUMENTS } from "@/config/documents";
import { CONTACT_EMAIL } from "@/config/contact";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

const Index = () => {
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    website: '', // Honeypot field
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch and increment visitor count on mount
    const incrementVisitorCount = async () => {
      try {
        const response = await fetch('/api/visit', {
          method: 'POST',
        });

        if (response.ok) {
          const data = await response.json();
          setVisitorCount(data.count);
        }
      } catch (error) {
        console.error('Failed to fetch visitor count:', error);
        // Leave visitorCount as null to hide the card
      }
    };

    incrementVisitorCount();
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Message envoyé",
          description: "Votre message a été transmis. Nous vous répondrons rapidement.",
        });
        // Clear form on success
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          website: '',
        });
      } else {
        // Show specific validation errors if available
        const errorMessage = data.details && Array.isArray(data.details)
          ? data.details.join('. ')
          : data.error || "Échec de l'envoi du message. Veuillez réessayer.";

        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activities = [
    {
      title: "Revue",
      description: "Publication de poèmes et d&apos;oeuvres artistiques",
      icon: BookOpen,
      link: "/revue",
      color: "artistic-yellow"
    },
    {
      title: "Concours",
      description: "Concours poétiques et artistiques nationaux et régionaux",
      icon: Trophy,
      link: "/concours",
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
              <a href={DOCUMENTS.bulletinAdhesion.path} download>
                <Download className="h-4 w-4 mr-2" />
                Télécharger le bulletin d&apos;adhésion
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
              Notre communauté
            </h2>
          </div>
          
          <div className={`grid grid-cols-1 gap-6 mb-8 ${visitorCount !== null ? 'md:grid-cols-3' : 'md:grid-cols-2 max-w-2xl mx-auto'}`}>
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-serif-title font-bold text-accent mb-2">11</div>
                <p className="font-sans text-muted-foreground">Régions représentées</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-serif-title font-bold text-accent mb-2">700+</div>
                <p className="font-sans text-muted-foreground">Membres</p>
              </CardContent>
            </Card>
            {visitorCount !== null && (
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-serif-title font-bold text-accent mb-2">
                    {visitorCount.toLocaleString('fr-CH')}
                  </div>
                  <p className="font-sans text-muted-foreground">Visiteurs</p>
                </CardContent>
              </Card>
            )}
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

      {/* Documents Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif-title text-4xl font-bold text-primary mb-4">
              Nos documents
            </h2>
            <div className="w-24 h-1 bg-accent mx-auto mb-6"></div>
            <p className="font-sans text-lg text-muted-foreground max-w-2xl mx-auto">
              Téléchargez nos publications et documents officiels
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Bulletin d'adhésion */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
                <CardTitle className="font-serif-title text-xl text-primary">
                  Bulletin d&apos;adhésion
                </CardTitle>
                <CardDescription className="font-sans">
                  Formulaire pour devenir membre de la SPAF
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                  disabled={!DOCUMENTS.bulletinAdhesion.available}
                >
                  <a
                    href={DOCUMENTS.bulletinAdhesion.path}
                    download
                    className="flex items-center justify-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Télécharger (PDF)</span>
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Appel à poètes */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
                <CardTitle className="font-serif-title text-xl text-primary">
                  Appel à poètes
                </CardTitle>
                <CardDescription className="font-sans">
                  Préservons la poésie francophone
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!DOCUMENTS.appelPoetes.available}
                  onClick={() => {
                    if (DOCUMENTS.appelPoetes.available) {
                      window.open(DOCUMENTS.appelPoetes.path, '_blank');
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span>
                    {DOCUMENTS.appelPoetes.available
                      ? "Télécharger (PDF)"
                      : "Bientôt disponible"}
                  </span>
                </Button>
              </CardContent>
            </Card>

            {/* Haïku de Nadine Najman */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
                <CardTitle className="font-serif-title text-xl text-primary">
                  Haïku de Nadine Najman
                </CardTitle>
                <CardDescription className="font-sans">
                  Le haïku, une écriture de l&apos;instant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!DOCUMENTS.haikuNadineNajman.available}
                  onClick={() => {
                    if (DOCUMENTS.haikuNadineNajman.available) {
                      window.open(DOCUMENTS.haikuNadineNajman.path, '_blank');
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span>
                    {DOCUMENTS.haikuNadineNajman.available
                      ? "Télécharger (PDF)"
                      : "Bientôt disponible"}
                  </span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Membership Section */}
      <section className="py-16 px-4 bg-background">
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
                  Rejoignez une communauté d&apos;artistes en France et dans la francophonie.
                  L&apos;adhésion est requise pour participer aux concours. L&apos;abonnement à la revue
                  ouvre la possibilité de proposer une parution.
                </p>
              </div>

              <div className="rounded-2xl border bg-background/60 p-5 mb-6">
                <p className="font-sans font-medium text-primary mb-3">Comment adhérer</p>
                <ol className="space-y-2">
                  <li className="font-sans text-sm">
                    <strong>1.</strong>{" "}
                    <a
                      href={DOCUMENTS.bulletinAdhesion.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4 font-medium hover:opacity-80"
                    >
                      Télécharger le bulletin d&apos;adhésion
                    </a>
                  </li>
                  <li className="font-sans text-sm">
                    <strong>2.</strong> Entourez votre formule et remplissez vos coordonnées
                  </li>
                  <li className="font-sans text-sm">
                    <strong>3.</strong> Envoyez-le par email ou par courrier
                  </li>
                </ol>
              </div>

              {/* Main offer */}
              <div className="rounded-2xl border border-accent/25 bg-gradient-to-br from-background to-accent/5 p-6 md:p-7 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-accent/15 text-accent hover:bg-accent/15">
                        Le plus choisi
                      </Badge>
                      {/* <span className="font-sans text-xs text-muted-foreground">
                        Le plus choisi
                      </span> */}
                    </div>

                    <h4 className="font-serif-title text-xl md:text-2xl text-primary">
                      Adhésion + abonnement à la revue
                    </h4>

                    <p className="font-sans text-sm text-muted-foreground mt-2 leading-relaxed max-w-xl">
                      Le meilleur équilibre pour participer aux concours et suivre la vie de l&apos;association.
                      <span className="text-foreground/90"> Bonus :</span> pour toute personne abonnée, parution offerte d&apos;un poème ou d&apos;une œuvre
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
                          Communauté d&apos;artistes en France et dans la francophonie
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
                      <Button asChild variant="outline">
                        <a href={DOCUMENTS.bulletinAdhesion.path} download>
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger le bulletin d&apos;adhésion
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
                  Les événements peuvent être payants et font l&apos;objet d&apos;une organisation séparée.
                </p>
              </div>

               {/* “More” (collapsible) */}
              <div className="max-w-3xl mx-auto mt-4">
                <Accordion type="single" collapsible>
                  <AccordionItem value="tarifs">
                    <AccordionTrigger className="font-sans">
                      Voir toutes les formules
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        <div className="flex justify-between gap-6">
                          <span className="font-sans text-sm">Adhésion (sans revue)</span>
                          <span className="font-sans text-sm font-semibold">24€</span>
                        </div>
                        <div className="flex justify-between gap-6">
                          <span className="font-sans text-sm">Abonnement revue (sans adhésion)</span>
                          <span className="font-sans text-sm font-semibold">33€</span>
                        </div>
                        <div className="flex justify-between gap-6">
                          <span className="font-sans text-sm">Abonnement et adhésion</span>
                          <span className="font-sans text-sm font-semibold">40€</span>
                        </div>
                        <div className="flex justify-between gap-6">
                          <span className="font-sans text-sm">Membre bienfaiteur</span>
                          <span className="font-sans text-sm font-semibold">60€</span>
                        </div>
                        <div className="flex justify-between gap-6">
                          <span className="font-sans text-sm">Couple</span>
                          <span className="font-sans text-sm font-semibold">48€</span>
                        </div>
                        <div className="flex justify-between gap-6">
                          <span className="font-sans text-sm">
                            Le numéro <span className="text-muted-foreground">( + 5€ frais d&apos;envoi )</span>
                          </span>
                          <span className="font-sans text-sm font-semibold">12€</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
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
                  <div className="font-serif-title text-2xl font-bold text-primary">60€</div>
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
                  {/* Honeypot field - hidden from humans, traps bots */}
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="absolute opacity-0 -z-10"
                    tabIndex={-1}
                    aria-hidden="true"
                    autoComplete="off"
                  />

                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-sans">Nom complet</Label>
                    <Input
                      id="name"
                      placeholder="Votre nom"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={isSubmitting}
                      maxLength={200}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-sans">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="font-sans">Sujet</Label>
                    <Input
                      id="subject"
                      placeholder="Sujet de votre message"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      disabled={isSubmitting}
                      maxLength={300}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="font-sans">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Votre message... (max 5000 caractères)"
                      rows={5}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      disabled={isSubmitting}
                      maxLength={5000}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    <Mail className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
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
                    <h4 className="font-sans font-semibold text-foreground">Pascal Lecordier</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-accent" />
                      <span className="font-sans text-sm">{CONTACT_EMAIL}</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-4 w-4 text-accent mt-1" />
                      <div className="font-sans text-sm">
                        <p>11 rue Juliette Récamier</p>
                        <p>69130 Écully</p>
                        <p>France</p>
                      </div>
                    </div>
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
