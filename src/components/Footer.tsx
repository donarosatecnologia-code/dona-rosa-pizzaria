import { Instagram, Facebook } from "lucide-react";
import logoSmall from "@/assets/logo-small.png";

const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Col 1 - Logo & Social */}
          <div>
            <img
              src={logoSmall}
              alt="Dona Rosa"
              className="h-16 mb-4"
              style={{ filter: "brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(-10deg) brightness(0.7)" }}
            />
            <p className="text-sm opacity-70 mb-3">Redes Sociais</p>
            <div className="flex gap-3">
              <a href="#" className="opacity-70 hover:opacity-100 transition-opacity" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="#" className="opacity-70 hover:opacity-100 transition-opacity" aria-label="Facebook">
                <Facebook size={20} />
              </a>
            </div>
            <div className="mt-4 text-xs opacity-60 leading-relaxed">
              <p className="font-semibold mb-1">Endereço</p>
              <p>Rua Camilo de Araújo, 347</p>
              <p>Alto de Pinheiros, Vila Jataí</p>
              <p>São Paulo - SP, 05431-020</p>
            </div>
          </div>

          {/* Col 2 - Navegação */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Navegação</h4>
            <ul className="space-y-2 text-xs opacity-70">
              <li><a href="#quem-somos" className="hover:opacity-100">Quem Somos</a></li>
              <li><a href="#contato" className="hover:opacity-100">Contato</a></li>
              <li><a href="#cursos" className="hover:opacity-100">Eventos</a></li>
              <li><a href="#saude" className="hover:opacity-100">Saúde</a></li>
              <li><a href="#fotos" className="hover:opacity-100">Espaços</a></li>
            </ul>
          </div>

          {/* Col 3 - Cardápio */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Cardápio</h4>
            <ul className="space-y-2 text-xs opacity-70">
              <li>Pizzas</li>
              <li>Sobremesas</li>
              <li>Pastéis</li>
              <li>Salada e Antepastos</li>
              <li>Esfihas</li>
              <li>Cervejas</li>
              <li>Vinhos</li>
            </ul>
          </div>

          {/* Col 4 - Horário */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Horário de Funcionamento</h4>
            <ul className="space-y-2 text-xs opacity-70">
              <li>Terça – Quinta: 18:30 às 23:00</li>
              <li>Sexta – Sábado: 18:00 às 00:00</li>
              <li>Domingo: 18:00 às 23:00</li>
            </ul>
            <div className="mt-4">
              <p className="font-semibold text-xs mb-1">Contato</p>
              <p className="text-xs opacity-70">(11) 99860-2878</p>
              <p className="text-xs opacity-70">(11) 3031-7876</p>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs opacity-50">
          <p>© 2026 Dona Rosa Pizzaria - Desenvolvido por Janaina Guiotti</p>
          <div className="flex gap-4">
            <a href="/politica-de-privacidade" className="hover:opacity-100 transition-opacity">Políticas de Privacidade</a>
            <a href="/termos-de-uso" className="hover:opacity-100 transition-opacity">Termos de Uso</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
