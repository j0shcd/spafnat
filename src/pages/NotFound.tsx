import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="font-serif-title text-6xl font-bold text-primary mb-4">🚧</h1>
          <div className="w-16 h-1 bg-accent mx-auto mb-6"></div>
          <h2 className="font-serif-title text-2xl text-primary mb-4">Site en construction</h2>
          <p className="font-sans text-muted-foreground mb-8">
            Cette page est actuellement en cours de développement. Merci de votre patience.
          </p>
        </div>
        
        <Button 
          onClick={() => window.location.href = "/"} 
          className="bg-accent hover:bg-accent/90"
        >
          <Home className="h-4 w-4 mr-2" />
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
