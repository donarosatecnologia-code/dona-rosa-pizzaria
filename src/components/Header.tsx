import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import EditableWrapper from "@/components/EditableWrapper";
import { CmsPlaceholder } from "@/components/CmsPlaceholder";
import { useCmsImage } from "@/hooks/useCmsMedia";
import { useAdminMirrorEmbed } from "@/contexts/AdminMirrorEmbedContext";
import { useAdminMirrorSurface } from "@/hooks/useAdminMirrorSurface";
import { AddNavLinkButton, NavLinkActions } from "@/components/Footer";
import { cn } from "@/lib/utils";

const DEFAULT_HEADER_NAV: { label: string; href: string }[] = [
  { label: "Quem Somos", href: "/quem-somos" },
  { label: "Cardápio", href: "/cardapio" },
  { label: "Espaços", href: "/espacos" },
  { label: "Cursos e Eventos", href: "/cursos-e-eventos" },
  { label: "Saúde e Sustentabilidade", href: "/saude-e-sustentabilidade" },
];

function desktopNavLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    "relative rounded-md px-2 py-1.5 text-sm font-medium transition-colors duration-200",
    "after:pointer-events-none after:absolute after:bottom-0 after:left-1/2 after:h-[3px] after:w-0 after:-translate-x-1/2 after:rounded-full after:bg-primary after:transition-[width,opacity] after:duration-200",
    isActive
      ? "text-primary after:w-[72%] after:opacity-100"
      : "text-foreground hover:text-primary hover:after:w-[55%] hover:after:opacity-70",
  );
}

function mobileNavLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    "block border-b border-border/50 py-3 pl-2 text-sm font-medium transition-colors",
    isActive
      ? "border-l-2 border-l-primary bg-primary/5 text-primary"
      : "text-foreground hover:bg-muted/60",
  );
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

const Header = () => {
  const [open, setOpen] = useState(false);
  const headerLogoImage = useCmsImage("header-logo");
  const isEmbed = useAdminMirrorEmbed();
  const mirrorSurface = useAdminMirrorSurface();

  const { data: navLinks } = useQuery({
    queryKey: ["nav-links"],
    queryFn: async () => {
      const { data, error } = await supabase.from("nav_links").select("*").order("sort_order");
      if (error) {
        throw error;
      }
      return data;
    },
  });

  const headerFromDb = (navLinks ?? [])
    .filter((l) => l.column_key === "header")
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);

  const useDatabaseNav = headerFromDb.length > 0;
  const headerClassName = isEmbed
    ? "sticky top-0 z-10 w-full border-b border-border bg-background/95 backdrop-blur-sm"
    : "fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm";

  return (
    <header className={headerClassName}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <EditableWrapper id="header-logo" type="image" label="Logo Header">
          <a href="/" className="inline-flex min-h-[3rem] items-center">
            {headerLogoImage ? (
              <img src={headerLogoImage} alt="Dona Rosa" className="h-12" />
            ) : (
              <CmsPlaceholder label="Logo do header" className="min-w-[8rem] px-4 py-2 text-xs" />
            )}
          </a>
        </EditableWrapper>

        <nav className="hidden items-center gap-4 lg:flex">
          {useDatabaseNav
            ? headerFromDb.map((link, index) => (
                <span key={link.id} className="flex items-center gap-1">
                  {isExternalHref(link.url) ? (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <NavLink to={link.url} className={desktopNavLinkClass}>
                      {link.label}
                    </NavLink>
                  )}
                  {mirrorSurface && (
                    <NavLinkActions
                      linkId={link.id}
                      label={link.label}
                      url={link.url}
                      canMoveUp={index > 0}
                      canMoveDown={index < headerFromDb.length - 1}
                      allLinks={headerFromDb}
                    />
                  )}
                </span>
              ))
            : DEFAULT_HEADER_NAV.map((item) => (
                <NavLink key={item.href} to={item.href} className={desktopNavLinkClass} end={item.href === "/"}>
                  {item.label}
                </NavLink>
              ))}
          {mirrorSurface && (
            <AddNavLinkButton columnKey="header" existingLinks={useDatabaseNav ? headerFromDb : []} />
          )}
        </nav>

        <NavLink
          to="/contato"
          className={({ isActive }) =>
            cn(
              "btn-primary-dr hidden lg:inline-flex",
              isActive && "ring-2 ring-primary/40 ring-offset-2 ring-offset-background",
            )
          }
        >
          Contato
        </NavLink>

        <button className="text-foreground lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu" type="button">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 pb-4 lg:hidden">
          {useDatabaseNav
            ? headerFromDb.map((link) =>
                isExternalHref(link.url) ? (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border-b border-border/50 py-3 text-sm font-medium text-foreground"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </a>
                ) : (
                  <NavLink
                    key={link.id}
                    to={link.url}
                    className={mobileNavLinkClass}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                ),
              )
            : DEFAULT_HEADER_NAV.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={mobileNavLinkClass}
                  end={item.href === "/"}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
          <NavLink
            to="/contato"
            className={({ isActive }) =>
              cn("btn-primary-dr mt-3 inline-block", isActive && "ring-2 ring-primary/30")
            }
            onClick={() => setOpen(false)}
          >
            Contato
          </NavLink>
        </div>
      )}
    </header>
  );
};

export default Header;
