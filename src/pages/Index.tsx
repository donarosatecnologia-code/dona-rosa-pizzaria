import Header from "@/components/Header";
import Hero from "@/components/Hero";
import QuemSomos from "@/components/QuemSomos";
import Cardapio from "@/components/Cardapio";
import Contato from "@/components/Contato";
import Cursos from "@/components/Cursos";
import Saude from "@/components/Saude";
import Fotos from "@/components/Fotos";
import Footer from "@/components/Footer";

const Index = () => {
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
    </div>
  );
};

export default Index;
