import { useState } from "react";
import { Menu, X } from "lucide-react";
import EditableWrapper from "@/components/EditableWrapper";
import logoSmall from "@/assets/logo-small.png";

const navItems = [
  { label: "Quem Somos", href: "/quem-somos" },
  { label: "Cardápio", href: "/cardapio" },
  { label: "Espaços", href: "/#contato" },
  { label: "Cursos e Eventos", href: "/#cursos" },
  { label: "Saúde e Sustentabilidade", href: "/#saude" },
];

const Header = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <EditableWrapper id="header-logo" type="image" label="Logo Header">
          <a href="/">
            <img src={logoSmall} alt="Dona Rosa" className="h-12" />
          </a>
        </EditableWrapper>

        <nav className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a href="/#contato" className="hidden lg:inline-block btn-primary-dr">
          Contato
        </a>

        <button
          className="lg:hidden text-foreground"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-background border-t border-border px-4 pb-4">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block py-3 text-sm font-medium text-foreground border-b border-border/50"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <a href="/#contato" className="inline-block mt-3 btn-primary-dr" onClick={() => setOpen(false)}>
            Contato
          </a>
        </div>
      )}
    </header>
  );
};

export default Header;
