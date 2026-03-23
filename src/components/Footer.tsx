import { Instagram, Facebook, Youtube, Twitter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import EditableWrapper from "@/components/EditableWrapper";
import logoBranco from "@/assets/logo-branco.png";

const Footer = () => {
  const { data: categories } = useQuery({
    queryKey: ["footer-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("name, slug")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <footer className="bg-foreground text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Col 1 - Logo & Social */}
          <div>
            <EditableWrapper id="footer-logo" type="image" label="Logo Footer">
              <a href="/">
                <img src={logoBranco} alt="Dona Rosa" className="h-16 mb-4" />
              </a>
            </EditableWrapper>
            <p className="text-sm opacity-70 mb-3">Redes Sociais</p>
            <div className="flex gap-3">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity" aria-label="YouTube">
                <Youtube size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity" aria-label="Twitter">
                <Twitter size={20} />
              </a>
            </div>
            <EditableWrapper id="footer-address" type="textarea" label="Endereço Footer">
              <div className="mt-4 text-xs opacity-60 leading-relaxed">
                <p className="font-semibold mb-1">Endereço</p>
                <p>Rua Camilo de Araújo, 347</p>
                <p>Alto de Pinheiros, Vila Jataí</p>
                <p>São Paulo - SP, 05431-020</p>
              </div>
            </EditableWrapper>
          </div>

          {/* Col 2 - Navegação */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Navegação</h4>
            <ul className="space-y-2 text-xs opacity-70">
              <li><a href="/" className="hover:opacity-100 transition-opacity">Home</a></li>
              <li><a href="/quem-somos" className="hover:opacity-100 transition-opacity">Quem Somos</a></li>
              <li><a href="/cardapio" className="hover:opacity-100 transition-opacity">Cardápio</a></li>
              <li><a href="/#contato" className="hover:opacity-100 transition-opacity">Contato</a></li>
              <li><a href="/#cursos" className="hover:opacity-100 transition-opacity">Eventos</a></li>
              <li><a href="/#saude" className="hover:opacity-100 transition-opacity">Saúde</a></li>
              <li><a href="/#fotos" className="hover:opacity-100 transition-opacity">Espaços</a></li>
            </ul>
          </div>

          {/* Col 3 - Cardápio (dynamic anchors) */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Cardápio</h4>
            <ul className="space-y-2 text-xs opacity-70">
              {(categories ?? []).map((cat) => (
                <li key={cat.slug}>
                  <a href={`/cardapio#${cat.slug}`} className="hover:opacity-100 transition-opacity">
                    {cat.name}
                  </a>
                </li>
              ))}
              {(!categories || categories.length === 0) && (
                <>
                  <li><a href="/cardapio#pizzas" className="hover:opacity-100 transition-opacity">Pizzas</a></li>
                  <li><a href="/cardapio#bebidas" className="hover:opacity-100 transition-opacity">Bebidas</a></li>
                  <li><a href="/cardapio#sobremesas" className="hover:opacity-100 transition-opacity">Sobremesas</a></li>
                  <li><a href="/cardapio#vinhos" className="hover:opacity-100 transition-opacity">Vinhos</a></li>
                </>
              )}
            </ul>
          </div>

          {/* Col 4 - Horário */}
          <div>
            <EditableWrapper id="footer-horario" type="textarea" label="Horário de Funcionamento">
              <div>
                <h4 className="font-semibold mb-4 text-sm">Horário de Funcionamento</h4>
                <ul className="space-y-2 text-xs opacity-70">
                  <li>Terça – Quinta: 18:30 às 23:00</li>
                  <li>Sexta – Sábado: 18:00 às 00:00</li>
                  <li>Domingo: 18:00 às 23:00</li>
                </ul>
              </div>
            </EditableWrapper>
            <EditableWrapper id="footer-contato" type="textarea" label="Contato Footer">
              <div className="mt-4">
                <p className="font-semibold text-xs mb-1">Contato</p>
                <p className="text-xs opacity-70">(11) 99860-2878</p>
                <p className="text-xs opacity-70">(11) 3031-7876</p>
              </div>
            </EditableWrapper>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs opacity-50">
          <p>© 2026 Dona Rosa Pizzaria - Desenvolvido por <a href="https://janaina-guiotti.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity underline">Janaina Guiotti</a></p>
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
