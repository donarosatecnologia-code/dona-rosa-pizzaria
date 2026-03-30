import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { BrandAlecrim, BrandLinhaDecorativa } from "@/components/BrandAccents";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted">
      <BrandAlecrim className="absolute -left-4 bottom-24 h-32 opacity-[0.2]" />
      <BrandLinhaDecorativa className="absolute right-10 top-20 h-9 w-auto opacity-15 rotate-6 hidden sm:block" />
      <div className="relative z-10 text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Página não encontrada</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Voltar para a página inicial
        </a>
      </div>
    </div>
  );
};

export default NotFound;
