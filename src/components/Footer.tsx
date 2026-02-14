import { MapPin, Mail, Download } from "lucide-react";
import { DOCUMENTS } from "@/config/documents";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div>
            <h3 className="font-serif-title text-xl font-semibold mb-4">
              Siège social
            </h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 mt-1 text-artistic-yellow" />
                <div className="font-sans">
                  <p>Mairie de Chasseneuil du Poitou</p>
                  <p>10bis rue du 11 novembre</p>
                  <p>86360 Chasseneuil du Poitou</p>
                  <p>France</p>
                  <p className="text-xs opacity-75 mt-2 italic">
                    Pour tout courrier destiné au siège social, l'envoyer au Président Lecordier Pascal, 11 rue Juliette Récamier, 69130 Écully. Il n'y a pas de permanence à Chasseneuil du Poitou au moulin.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-artistic-yellow" />
                <span className="font-sans">jcohendumani7@gmail.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Download className="h-5 w-5 text-artistic-yellow" />
                <button
                  onClick={(e) => {
                    if (!DOCUMENTS.formulaireConfidentialite.available) {
                      e.preventDefault();
                    } else {
                      window.open(DOCUMENTS.formulaireConfidentialite.path, '_blank');
                    }
                  }}
                  disabled={!DOCUMENTS.formulaireConfidentialite.available}
                  className="font-sans opacity-90 hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Formulaire de confidentialité
                </button>
              </div>
            </div>
          </div>

          {/* About */}
          <div>
            <h3 className="font-serif-title text-xl font-semibold mb-4">
              À propos
            </h3>
            <p className="font-sans text-sm leading-relaxed opacity-90">
              La Société des Poètes et Artistes de France fédère depuis 1958
              poètes, écrivains, artistes, peintres, photographes et musiciens
              autour d'une passion commune : l'expression artistique.
            </p>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center">
          <p className="font-sans text-sm opacity-75">
            © {new Date().getFullYear()} Société des Poètes et Artistes de France - Tous droits réservés
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
