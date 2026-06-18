import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { CONTACT_EMAIL } from "@/config/contact";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { DEFAULT_DELEGATIONS, type Delegation } from "@/config/delegations";

const Delegations = () => {
  const [delegations, setDelegations] = useState<Delegation[]>(DEFAULT_DELEGATIONS);

  useEffect(() => {
    let isMounted = true;

    if (typeof fetch === 'undefined') {
      return () => {
        isMounted = false;
      };
    }

    fetch('/api/delegations')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to fetch delegations');
        }
        return response.json() as Promise<{ delegations?: Delegation[] }>;
      })
      .then((data) => {
        if (isMounted && Array.isArray(data.delegations)) {
          setDelegations(data.delegations);
        }
      })
      .catch(() => {
        // Keep the bundled defaults visible if the API is unavailable.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const leftColumnDelegations = delegations.filter((_, index) => index % 2 === 0);
  const rightColumnDelegations = delegations.filter((_, index) => index % 2 !== 0);

  const renderDelegationCard = (
    delegation: (typeof delegations)[number],
    index: number
  ) => (
    <Card key={delegation.id || `${delegation.region}-${index}`} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="font-serif-title text-2xl text-primary">
            {delegation.region}
          </CardTitle>
        </div>
        <CardDescription className="font-sans text-foreground">
          {delegation.gender === "F" ? "Déléguée" : "Délégué"} : <strong>{delegation.delegate}</strong>
        </CardDescription>
        {delegation.website ? (
          <div className="pt-3">
            <Button variant="outline" size="sm" asChild>
              <a
                href={delegation.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                Accéder au site web
              </a>
            </Button>
          </div>
        ) : null}
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
  );

  return (
    <>
    <PageBreadcrumb currentPage="Délégations Régionales" />
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
        <div className="lg:hidden space-y-6">
          {delegations.map(renderDelegationCard)}
        </div>
        <div className="hidden lg:grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {leftColumnDelegations.map(renderDelegationCard)}
          </div>
          <div className="space-y-6">
            {rightColumnDelegations.map(renderDelegationCard)}
          </div>
        </div>

        {/* Payment Instructions */}
        <Card className="mt-12 bg-muted/30">
          <CardHeader>
            <CardTitle className="font-serif-title text-xl text-primary">
              Modalités de paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="font-sans text-foreground">
            <p>
              Le montant de l'abonnement et celui de la cotisation sont à verser au délégué par chèque libellé à son nom.
            </p>
          </CardContent>
        </Card>

        {/* Treasurer Contact */}
        <Card className="mt-12 bg-muted/30">
          <CardHeader>
            <CardTitle className="font-serif-title text-xl text-primary">
              Délégations sans responsables
            </CardTitle>
          </CardHeader>
          <CardContent className="font-sans text-foreground space-y-2">
            <p>
              Si votre région n'a pas encore de responsable, envoyez directement à la trésorière votre cotisation :
            </p>
            <div className="pl-4 border-l-2 border-accent">
              <p className="font-semibold">Mme LECORDIER Flore</p>
              <p>11 rue Juliette Récamier</p>
              <p>69130 ÉCULLY</p>
            </div>
          </CardContent>
        </Card>

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
              <Button variant="outline" asChild className="text-primary hover:text-primary-foreground">
                <a href={`mailto:${CONTACT_EMAIL}`}>
                  Devenir délégué
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
};

export default Delegations;
