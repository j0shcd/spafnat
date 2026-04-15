import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

const Layout = () => {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main key={location.pathname} className="flex-1 animate-fade-in-up">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;