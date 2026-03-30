import Header from "@/components/Header";
import Hero from "@/components/Hero";
import QuemSomos from "@/components/QuemSomos";
import Cardapio from "@/components/Cardapio";
import Contato from "@/components/Contato";
import Cursos from "@/components/Cursos";
import Saude from "@/components/Saude";
import Fotos from "@/components/Fotos";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useHomeBootstrap } from "@/hooks/useHomeBootstrap";

const Index = () => {
  const { isPending, isError } = useHomeBootstrap();

  if (isPending) {
    return <LoadingScreen message="Carregando conteúdo…" />;
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-center text-muted-foreground">Não foi possível carregar o conteúdo. Tente novamente mais tarde.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <QuemSomos />
      <Cardapio />
      <Contato />
      <Cursos />
      <Saude />
      <Fotos />
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
