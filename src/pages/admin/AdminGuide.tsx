/**
 * AdminGuide — full user guide for the SPAF admin panel.
 *
 * Content ported from user_guides/GUIDE_UTILISATEUR.md.
 * FAQ rendered as an interactive Accordion for elderly-friendly UX.
 * Large text, generous spacing — same conventions as other admin pages.
 */

import { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// ─── Table of Contents ────────────────────────────────────────────────────────

const TOC_ITEMS = [
  { id: 'acceder', label: 'Accéder' },
  { id: 'documents', label: 'Documents' },
  { id: 'photos', label: 'Photos' },
  { id: 'concours', label: 'Concours' },
  { id: 'deconnexion', label: 'Déconnexion' },
  { id: 'faq', label: 'FAQ' },
  { id: 'bonnes-pratiques', label: 'Bonnes Pratiques' },
  { id: 'aide', label: 'Aide' },
];

function TableOfContents({ activeId }: { activeId: string }) {
  return (
    <nav className="hidden xl:block w-44 shrink-0">
      <div className="sticky top-6 bg-muted/50 backdrop-blur-sm border rounded-lg p-3">
        <p className="font-semibold text-foreground mb-2 text-xs uppercase tracking-wide">
          Sommaire
        </p>
        <ul className="space-y-1">
          {TOC_ITEMS.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`block py-1 px-2 rounded text-sm transition-colors ${
                  activeId === id
                    ? 'text-primary font-medium bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

// ─── Guide sections ──────────────────────────────────────────────────────────

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-3xl font-serif-title font-bold text-primary mt-10 mb-4 scroll-mt-4">
      {children}
    </h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xl font-semibold text-foreground mt-6 mb-2">
      {children}
    </h3>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted border-l-4 border-primary rounded-r-md px-4 py-3 my-3 text-lg">
      {children}
    </div>
  );
}

function Steps({ steps }: { steps: string[] }) {
  const renderStepContent = (step: string) => {
    const segments = step.split(/<strong>(.*?)<\/strong>/g);
    return segments.map((segment, index) => {
      if (index % 2 === 1) {
        return <strong key={`strong-${index}`}>{segment}</strong>;
      }
      return <span key={`text-${index}`}>{segment}</span>;
    });
  };

  return (
    <ol className="list-decimal list-inside space-y-2 text-lg text-foreground pl-2">
      {steps.map((step, i) => (
        <li key={i}>{renderStepContent(step)}</li>
      ))}
    </ol>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminGuide() {
  const [activeId, setActiveId] = useState('acceder');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-10% 0px -80% 0px' }
    );

    TOC_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex gap-8 p-4 sm:p-6 max-w-4xl mx-auto pb-16">
      {/* Main guide content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif-title font-bold text-primary mb-2">
            Guide d'utilisation
          </h1>
          <p className="text-lg text-muted-foreground">
            Comment gérer le contenu du site SPAF au quotidien.
          </p>
        </div>

        <p className="text-lg text-foreground mb-2">Ce guide vous explique comment :</p>
        <ul className="list-disc list-inside space-y-1 text-lg text-foreground mb-6 pl-2">
          <li>Téléverser et remplacer les documents PDF</li>
          <li>Ajouter et supprimer des photos de congrès</li>
          <li>Gérer les documents des concours (règlements et palmarès)</li>
          <li>Réorganiser l'ordre d'affichage des documents</li>
        </ul>

        {/* ── Section 1 : Accéder ── */}
        <SectionHeading id="acceder">📌 Accéder au Panneau d'Administration</SectionHeading>

        <SubHeading>Étape 1 : Ouvrir la page de connexion</SubHeading>
        <p className="text-lg text-foreground mb-2">
          Dans votre navigateur (Chrome, Safari, Firefox), tapez l'adresse :
        </p>
        <code className="block bg-muted rounded px-4 py-2 text-base font-mono mb-4 select-all">
          https://spafnat.pages.dev/admin
        </code>

        <SubHeading>Étape 2 : Se connecter</SubHeading>
        <Steps
          steps={[
            'Entrez votre <strong>nom d\'utilisateur</strong> (fourni séparément)',
            'Entrez votre <strong>mot de passe</strong> (fourni séparément)',
            'Cliquez sur le bouton <strong>« Se connecter »</strong>',
          ]}
        />
        <Tip>
          <p className="font-semibold mb-1">Important :</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Si vous vous trompez 5 fois de mot de passe, vous devrez attendre 15 minutes avant de réessayer.</li>
            <li>Pour changer votre mot de passe, contactez Josh directement.</li>
          </ul>
        </Tip>

        <SubHeading>Étape 3 : Le tableau de bord</SubHeading>
        <p className="text-lg text-foreground mb-2">
          Après connexion, vous arrivez sur la page des <strong>Documents</strong>.
          Sur la gauche, vous verrez plusieurs sections :
        </p>
        <ol className="list-decimal list-inside space-y-1 text-lg text-foreground pl-2 mb-4">
          <li><strong>Documents</strong> — Gérer les PDFs téléchargeables</li>
          <li><strong>Photos</strong> — Gérer les photos de congrès</li>
          <li><strong>Concours</strong> — Gérer les règlements et palmarès</li>
          <li><strong>Retour au site</strong> — Quitter le mode admin et revenir au site public</li>
        </ol>

        {/* ── Section 2 : Documents ── */}
        <SectionHeading id="documents">📄 Gérer les Documents</SectionHeading>
        <p className="text-lg text-foreground mb-4">
          Les documents sont les <strong>fichiers PDF</strong> que les visiteurs peuvent télécharger sur le site:
        </p>
        <ul className="list-disc list-inside space-y-1 text-lg text-foreground pl-2 mb-4">
          <li><strong>Bulletin d'adhésion</strong> — Formulaire d'inscription annuelle</li>
          <li><strong>Inscription Congrès</strong> — Formulaire d'inscription au congrès</li>
          <li><strong>Extrait de la Revue</strong> — Aperçu de la dernière revue publiée</li>
        </ul>

        <Tip>
          Tous les documents doivent être des fichiers de type <code>.pdf</code>, et ne doivent pas dépasser 5 Mo. Si votre fichier est trop lourd, contacter Flore pour le compresser avant téléversement.
        </Tip>

        <SubHeading>Téléverser (remplacer) un document</SubHeading>
         <Tip>
          <strong>Le titre qui apparaît sur le site web est généré à partir du nom du fichier PDF. <br /></strong>
          Exemple : <code>Revue 264 - Janvier 2026.pdf</code> → Titre : « Revue 264 - Janvier 2026 »
        </Tip>
        <Steps
          steps={[
            'Cliquez sur <strong>« Documents »</strong> dans le menu de gauche',
            'Trouvez le document à remplacer (ex : « Bulletin d\'adhésion »)',
            'Cliquez sur le bouton <strong>« Téléverser »</strong>',
            'Une fenêtre s\'ouvre pour choisir votre fichier',
            'Sélectionnez le nouveau PDF sur votre ordinateur',
            'Cliquez sur <strong>« Ouvrir »</strong>',
            '<strong>Attendez quelques secondes</strong> — un message « Document téléversé avec succès » apparaît en bas à droite',
          ]}
        />
        <p className="text-lg text-foreground mt-2">
          ✅ <strong>C'est fait !</strong> L'ancien document est automatiquement remplacé par le nouveau.
        </p>

        <p className="text-lg text-foreground">
          Vous pouvez cliquer sur <strong>« Voir »</strong> pour ouvrir le PDF et vérifier son contenu, ou essayer de le télécharger directement depuis le site.
        </p>

       

        {/* <SubHeading>Vérifier qu'un document est en ligne</SubHeading>
        <p className="text-lg text-foreground mb-2">Regardez le <strong>badge de statut</strong> sous le titre du document :</p>
        <ul className="list-disc list-inside space-y-1 text-lg text-foreground pl-2 mb-3">
          <li><strong>Badge « En ligne »</strong> ✅ — Les visiteurs peuvent le télécharger</li>
          <li><strong>Badge « Non disponible »</strong> ⚠️ — Pas encore de fichier</li>
        </ul> */}

        <SubHeading>Supprimer un document</SubHeading>

        <Steps
          steps={[
            'Cliquez sur <strong>« Supprimer »</strong> sous le document concerné',
            'Une fenêtre de confirmation apparaît',
            'Cliquez sur <strong>« Supprimer »</strong> pour confirmer (ou <strong>« Annuler »</strong> si vous changez d\'avis)',
          ]}
        />
        <p className="text-lg text-foreground mt-2">
          💡 Si vous supprimez par erreur, il suffit de téléverser à nouveau le fichier.
        </p>

        <Tip>
          <strong>Attention :</strong> Supprimer un document le retire définitivement du site. Les visiteurs ne pourront plus le télécharger.
        </Tip>

        {/* ── Section 3 : Photos ── */}
        <SectionHeading id="photos">📸 Gérer les Photos de Congrès</SectionHeading>
        <p className="text-lg text-foreground mb-4">
          Cette section vous permet d'ajouter et de gérer les <strong>photos des congrès</strong>
          {' '}qui apparaissent sur la page « Nos Congrès » du site.
        </p>

        <SubHeading>Choisir l'année du congrès</SubHeading>
        <p className="text-lg text-foreground mb-2">
          Les photos sont organisées par <strong>année de congrès</strong>. Avant d'ajouter des photos, sélectionnez l'année :
        </p>
        <Steps
          steps={[
            'Cliquez sur <strong>« Photos »</strong> dans le menu de gauche',
            'En haut de la page, cliquez sur le menu déroulant <strong>« Année »</strong>',
            'Sélectionnez l\'année du congrès (de 2010 à aujourd\'hui)',
          ]}
        />

        <SubHeading>Ajouter des photos</SubHeading>
        <Steps
          steps={[
            'Assurez-vous d\'avoir sélectionné la <strong>bonne année</strong> (voir ci-dessus)',
            'Cliquez sur le bouton <strong>« Téléverser des photos »</strong>',
            'Une fenêtre s\'ouvre pour choisir vos fichiers',
            'Vous pouvez sélectionner <strong>plusieurs photos à la fois</strong>',
            'Cliquez sur <strong>« Ouvrir »</strong>',
            '<strong>Attendez que toutes les photos soient téléversées</strong>',
            'Les photos s\'affichent automatiquement dans la galerie',
          ]}
        />
        <Tip>
          <p className="font-semibold mb-1">Formats acceptés et limites :</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Formats : <strong>JPG, PNG</strong></li>
            <li>Taille maximum : <strong>5 Mo par photo</strong></li>
            <li>Si une photo est trop lourde, contacter Flore pour compresser l'image avant téléversement.</li>
          </ul>
        </Tip>

        <SubHeading>Supprimer une photo</SubHeading>
        <Steps
          steps={[
            'Cliquez sur le bouton <strong>« Supprimer »</strong> en dessous de l\'image',
            'Une fenêtre de confirmation s\'ouvre avec un aperçu de la photo',
            'Cliquez sur <strong>« Supprimer »</strong> pour confirmer',
          ]}
        />
        <p className="text-lg text-foreground mt-2">
          ✅ La photo disparaît immédiatement de la galerie et du site public.
        </p>

        {/* ── Section 4 : Concours ── */}
        <SectionHeading id="concours">🏆 Gérer les Concours</SectionHeading>
        <p className="text-lg text-foreground mb-2">
          Cette section vous permet de gérer les <strong>documents des concours</strong> : règlements et palmarès.
          Il y a <strong>3 catégories</strong> de documents :
        </p>
        <ol className="list-decimal list-inside space-y-1 text-lg text-foreground pl-2 mb-4">
          <li><strong>Règlements</strong> — Les règles des concours en cours</li>
          <li><strong>Palmarès Poétique</strong> — Résultats des concours de poésie</li>
          <li><strong>Palmarès Artistique</strong> — Résultats des concours artistiques</li>
        </ol>

        <SubHeading>Choisir la catégorie</SubHeading>
        <p className="text-lg text-foreground mb-2">
          En haut de la page, vous verrez <strong>3 onglets</strong> : Règlements, Palmarès Poétique, Palmarès Artistique.
          Cliquez sur l'onglet correspondant au document que vous voulez gérer.
        </p>

        <SubHeading>Ajouter un document de concours</SubHeading>
        <Steps
          steps={[
            'Sélectionnez la bonne catégorie (onglet)',
            'Cliquez sur le bouton <strong>« Téléverser PDF »</strong> en haut à droite',
            'Choisissez votre fichier PDF',
            'Cliquez sur <strong>« Ouvrir »</strong>',
            'Le document apparaît dans la liste',
          ]}
        />
        <Tip>
          <p className="font-semibold mb-1">Détails importants :</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Le <strong>titre</strong> du document est créé automatiquement à partir du nom de fichier.
              Exemple : <code>Concours Normandie 2026.pdf</code> apparaîtra comme « Concours Normandie 2026 » sur le site public.
            </li>
            <li>
              Si vous téléversez un fichier avec le <strong>même nom</strong> qu'un existant,
              le système vous avertira — renommez votre fichier ou supprimez l'ancien.
            </li>
          </ul>
        </Tip>

        <SubHeading>Réorganiser l'ordre des documents</SubHeading>
        <p className="text-lg text-foreground mb-2">
          Sur le site public, les documents s'affichent dans l'ordre que vous définissez ici.
          Le premier de la liste apparaît en haut.
        </p>
        <Steps
          steps={[
            'Trouvez le document à déplacer dans la liste',
            'À droite du titre, vous verrez deux <strong>petites flèches</strong> : ↑ pour monter, ↓ pour descendre',
            'Cliquez sur <strong>↑</strong> pour faire monter le document dans la liste',
            'Cliquez sur <strong>↓</strong> pour le faire descendre',
          ]}
        />
        <Tip>
          Mettez les documents les plus récents en haut de la liste.
          Le palmarès en haut de la liste apparaîtra comme le plus récent sur le site public.
        </Tip>

        <SubHeading>Supprimer un document de concours</SubHeading>
        <Steps
          steps={[
            'Cliquez sur le bouton <strong>« Supprimer »</strong> (rouge) sous le document',
            'Une fenêtre de confirmation s\'ouvre',
            'Vérifiez que c\'est bien le bon document',
            'Cliquez sur <strong>« Supprimer »</strong> pour confirmer',
          ]}
        />
        <p className="text-lg text-foreground mt-2">
          ✅ Le document disparaît de la liste et du site public.
        </p>

        {/* ── Section 5 : Déconnexion ── */}
        <SectionHeading id="deconnexion">🚪 Se Déconnecter</SectionHeading>
        <p className="text-lg text-foreground mb-3">
          <strong>Toujours se déconnecter quand vous avez terminé</strong>, surtout si vous utilisez un ordinateur partagé.
        </p>
        <p className="text-lg font-semibold text-foreground mb-1">Option 1 : Retour au site public</p>
        <Steps
          steps={[
            'Cliquez sur <strong>« Retour au site »</strong> dans le menu de gauche',
            'Vous êtes déconnecté automatiquement et redirigé vers la page d\'accueil',
          ]}
        />
        <p className="text-lg text-foreground mt-3">
          <strong>Option 2 : Fermer le navigateur</strong> — Si vous fermez simplement votre navigateur,
          vous resterez connecté pendant 24h. Utilisez de préférence le bouton « Retour au site »
          pour une déconnexion propre.
        </p>

        {/* ── FAQ ── */}
        <SectionHeading id="faq">❓ Questions Fréquentes</SectionHeading>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="faq-1">
            <AccordionTrigger className="text-lg text-left">
              « Je ne vois pas mes changements sur le site public »
            </AccordionTrigger>
            <AccordionContent className="text-lg">
              <ol className="list-decimal list-inside space-y-2 pl-2">
                <li>Retournez sur la page d'administration</li>
                <li>Cliquez sur <strong>« Retour au site »</strong></li>
                <li>Sur le site public, actualisez la page</li>
              </ol>
              <p className="mt-3">
                Parfois, votre navigateur garde en mémoire l'ancienne version de la page.
                L'actualisation force le rechargement.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-2">
            <AccordionTrigger className="text-lg text-left">
              « Mon fichier est refusé lors du téléversement »
            </AccordionTrigger>
            <AccordionContent className="text-lg">
              <p className="font-semibold mb-2">Causes possibles :</p>
              <ul className="list-disc list-inside space-y-3 pl-2">
                <li>
                  <strong>Fichier trop lourd (&gt; 5 Mo)</strong> — Compressez votre PDF avec
                  {' '}<strong>iLovePDF</strong> (ilovepdf.com) ou votre image avec <strong>iLoveIMG</strong> (iloveimg.com).
                </li>
                <li>
                  <strong>Mauvais format</strong> — Documents et concours : PDF uniquement. Photos : JPG ou PNG uniquement.
                </li>
                <li>
                  <strong>Nom de fichier identique à un existant</strong> — Renommez votre fichier
                  ou supprimez l'ancien document d'abord.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-3">
            <AccordionTrigger className="text-lg text-left">
              « Le téléversement semble bloqué »
            </AccordionTrigger>
            <AccordionContent className="text-lg">
              <p className="mb-2">Si le message de succès ne s'affiche pas après 30 secondes :</p>
              <ol className="list-decimal list-inside space-y-2 pl-2">
                <li><strong>Ne fermez pas la page</strong> — le téléversement continue en arrière-plan</li>
                <li>Attendez encore 1-2 minutes (les fichiers lourds peuvent prendre du temps)</li>
                <li>
                  Si après 3 minutes rien ne se passe : actualisez la page,
                  vérifiez si le fichier apparaît dans la liste, et si non, réessayez le téléversement.
                </li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-4">
            <AccordionTrigger className="text-lg text-left">
              « Je me suis trompé 5 fois de mot de passe »
            </AccordionTrigger>
            <AccordionContent className="text-lg">
              <p className="mb-2">
                Le système bloque l'accès pendant <strong>15 minutes</strong> pour des raisons de sécurité.
              </p>
              <ol className="list-decimal list-inside space-y-2 pl-2">
                <li>Attendez 15 minutes</li>
                <li>Vérifiez que vous utilisez le bon mot de passe</li>
                <li>Réessayez</li>
              </ol>
              <p className="mt-2">Si le problème persiste, contactez Josh pour réinitialiser votre mot de passe.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-5">
            <AccordionTrigger className="text-lg text-left">
              « Une photo ou un document a disparu »
            </AccordionTrigger>
            <AccordionContent className="text-lg">
              <p className="font-semibold mb-2">Causes possibles :</p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>
                  <strong>Suppression accidentelle</strong> — Téléversez à nouveau le fichier.
                </li>
                <li>
                  <strong>Mauvaise année sélectionnée</strong> (pour les photos) — Changez l'année
                  dans le menu déroulant.
                </li>
                <li>
                  <strong>Session expirée</strong> — Reconnectez-vous et vérifiez à nouveau.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* ── Best Practices ── */}
        <SectionHeading id="bonnes-pratiques">📋 Bonnes Pratiques</SectionHeading>

        <p className="text-lg font-semibold text-green-700 mb-2">✅ À faire :</p>
        <ul className="list-disc list-inside space-y-1 text-lg text-foreground pl-2 mb-6">
          <li>Toujours vérifier le document/photo après téléversement (bouton « Voir »)</li>
          <li>Se déconnecter après chaque session (bouton « Retour au site »)</li>
          <li>Utiliser des noms de fichiers clairs (ex : <code>Concours Bretagne 2026.pdf</code>)</li>
          <li>Compresser les fichiers lourds avant téléversement</li>
          <li>Sélectionner la bonne année pour les photos de congrès</li>
        </ul>

        <p className="text-lg font-semibold text-destructive mb-2">❌ À éviter :</p>
        <ul className="list-disc list-inside space-y-1 text-lg text-foreground pl-2 mb-6">
          <li>Fermer la page pendant un téléversement en cours</li>
          <li>Téléverser plusieurs fois le même fichier rapidement</li>
        </ul>

        {/* ── Support ── */}
        <SectionHeading id="aide">🆘 Besoin d'Aide ?</SectionHeading>
        <p className="text-lg text-foreground mb-2">
          Si vous rencontrez un problème non résolu dans ce guide, contactez Josh :
        </p>
        <div className="bg-muted rounded-lg px-6 py-4 text-lg space-y-1">
          <p><strong>Email :</strong> jcohendumani7@gmail.com</p>
        </div>
        <p className="text-lg text-muted-foreground mt-3">
          Informations utiles à inclure : ce que vous essayiez de faire, le message d'erreur exact
          (si affiché), et une capture d'écran si possible.
        </p>
      </div>

      {/* Table of Contents */}
      <TableOfContents activeId={activeId} />
    </div>
  );
}
