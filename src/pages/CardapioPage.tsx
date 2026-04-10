import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { BrandAlecrim, BrandLinhaDecorativa, BrandTomilho, BrandTrigo } from "@/components/BrandAccents";
import { useAdminMirrorEmbed } from "@/contexts/AdminMirrorEmbedContext";
import { useCmsContents } from "@/hooks/useCmsContent";
import { useSiteShellReady } from "@/hooks/useSiteShellReady";
import { LoadingScreen } from "@/components/LoadingScreen";
import { siteContainerClass } from "@/lib/siteLayout";
import {
  PIZZA_BROTO_PERCENT_OF_GRANDE,
  PIZZA_MINI_PERCENT_OF_GRANDE,
  pizzaSizePriceFromGrande,
} from "@/lib/pizzaPricing";
import { cn } from "@/lib/utils";

function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2)}`;
}

/** Linha decorativa à esquerda — apenas desktop (lg+), só em seções de duas colunas. Altura acompanha o texto; excedente é cortado. */
function CardapioDesktopLinhaAside() {
  return (
    <div
      className="pointer-events-none relative hidden w-[4.5rem] shrink-0 self-stretch overflow-hidden pt-1 min-h-0 lg:block"
      aria-hidden
    >
      <BrandLinhaDecorativa className="h-full min-h-0 w-full object-cover object-top drop-shadow-sm" />
    </div>
  );
}

/** Divisor vertical tracejado entre as duas colunas — apenas desktop. */
function CardapioDesktopColumnDivider() {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-0 -translate-x-1/2 border-l border-dashed border-muted-foreground/40 lg:block"
      aria-hidden
    />
  );
}

function isWineCategory(category: { name: string; slug: string }) {
  return /vinho/i.test(`${category.name} ${category.slug}`);
}

function isPizzaCategory(category: { has_pizza_size_pricing?: boolean | null }) {
  return !!category.has_pizza_size_pricing;
}

/** Só a seção principal "Pizzas" — não inclui Pizzas Veganas nem outras categorias com preço de tamanho. */
function isMainPizzasCategory(category: { name: string; slug: string }) {
  const name = category.name.trim().toLowerCase();
  const slug = category.slug.trim().toLowerCase();
  if (/vegan|vegana/i.test(`${name} ${slug}`)) {
    return false;
  }
  return name === "pizzas" || slug === "pizzas";
}

const CardapioPage = () => {
  const shell = useSiteShellReady();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isEmbed = useAdminMirrorEmbed();
  const { getText, isPending: cmsHeroPending } = useCmsContents(["cardapio-hero-title", "cardapio-hero-subtitle"], "cardapio");
  const heroTitle = getText("cardapio-hero-title");
  const heroSubtitle = getText("cardapio-hero-subtitle");

  const { data: categories, isPending: categoriesPending } = useQuery({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: products, isPending: productsPending } = useQuery({
    queryKey: ["public-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const showLoader = shell.isPending || cmsHeroPending || categoriesPending || productsPending;

  const groupedProducts = (categories ?? []).map((cat) => ({
    category: cat,
    items: (products ?? []).filter((p) => p.category_id === cat.id),
  })).filter((g) => g.items.length > 0);

  const scrollToCategory = (slug: string) => {
    const el = categoryRefs.current[slug];
    if (el) {
      const headerOffset = 120;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  // Handle hash on load
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      setTimeout(() => scrollToCategory(hash), 500);
    }
  }, [groupedProducts]);

  // Intersection observer for active anchor
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id);
          }
        }
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0 }
    );

    Object.values(categoryRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [groupedProducts]);

  if (showLoader) {
    return <LoadingScreen message="Carregando cardápio…" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero banner — textos em page_contents (page_key cardápio) */}
      <div className={cn("section-paper", isEmbed ? "pt-0" : "pt-16")}>
        <div className={cn(siteContainerClass, "relative overflow-hidden py-12 text-left md:py-16")}>
          <BrandAlecrim className="absolute left-0 top-0 hidden h-32 opacity-20 lg:block" />
          <BrandTrigo className="absolute right-8 top-1/2 hidden h-24 w-auto -translate-y-1/2 opacity-[0.14] xl:block" />
          <div className="relative z-10">
            {heroTitle ? (
              <h1 className="mb-3 text-4xl font-bold text-secondary md:text-5xl">{heroTitle}</h1>
            ) : (
              <h1 className="mb-3 min-h-[2.5rem] text-4xl font-bold text-secondary md:text-5xl">&nbsp;</h1>
            )}
            {heroSubtitle ? (
              <p className="w-full text-muted-foreground">{heroSubtitle}</p>
            ) : (
              <p className="min-h-[1.25rem] w-full text-muted-foreground">&nbsp;</p>
            )}
          </div>
        </div>
      </div>

      {/* Category anchor nav */}
      <nav className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className={cn(siteContainerClass, "flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide")}>
          {(categories ?? []).map((cat) => (
            <button
              key={cat.slug}
              onClick={() => scrollToCategory(cat.slug)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.slug
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </nav>

      {/* Menu sections */}
      <div className="pb-16">
        {groupedProducts.map((group, idx) => {
          const usePaper = idx % 2 === 0;
          const items = group.items;
          const isLargeSection = items.length > 6;
          const midpoint = Math.ceil(items.length / 2);
          const hasPizzaRules = isPizzaCategory(group.category);
          const hasWineGrouping = isWineCategory(group.category);
          const showLinhaDecorativa = isMainPizzasCategory(group.category);

          return (
            <section
              key={group.category.id}
              id={group.category.slug}
              ref={(el: HTMLDivElement | null) => { categoryRefs.current[group.category.slug] = el; }}
              className={`py-12 md:py-16 ${usePaper ? "section-paper" : "bg-background"} relative overflow-hidden`}
            >
              {usePaper ? (
                !hasPizzaRules ? (
                  <BrandTomilho className="pointer-events-none absolute -right-3 top-8 hidden h-20 w-auto opacity-[0.16] lg:block" />
                ) : null
              ) : (
                <BrandAlecrim className="pointer-events-none absolute left-0 bottom-8 hidden h-24 w-auto opacity-[0.92] lg:block" />
              )}
              <div className={siteContainerClass}>
                {/* Category title */}
                <div className="cardapio-section-heading mb-10 text-left">
                  <h2 className="relative inline-block text-3xl font-bold text-secondary md:text-4xl">
                    {group.category.name}
                    <span className="mt-3 block h-0.5 w-16 bg-primary" />
                  </h2>
                  {group.category.description && (
                    <p className="mt-3 w-full text-sm text-muted-foreground">
                      {group.category.description}
                    </p>
                  )}
                </div>

                {/* Desktop (lg+): linha à esquerda só na seção principal Pizzas (showLinhaDecorativa). */}
                {hasWineGrouping ? (
                  <div className="w-full">
                    <WineGroupedItems items={items} />
                  </div>
                ) : hasPizzaRules && isLargeSection ? (
                  <div className="flex w-full flex-row items-start gap-3 sm:gap-4 lg:items-stretch lg:gap-3">
                    {showLinhaDecorativa ? <CardapioDesktopLinhaAside /> : null}
                    <div className="relative min-w-0 w-full flex-1">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-0">
                        <div>
                          {items.slice(0, midpoint).map((item) => (
                            <MenuItem key={item.id} item={item} showPizzaSizes />
                          ))}
                        </div>
                        <div>
                          {items.slice(midpoint).map((item) => (
                            <MenuItem key={item.id} item={item} showPizzaSizes />
                          ))}
                        </div>
                      </div>
                      <CardapioDesktopColumnDivider />
                    </div>
                  </div>
                ) : hasPizzaRules ? (
                  <div className="w-full">
                    {items.map((item) => (
                      <MenuItem key={item.id} item={item} showPizzaSizes />
                    ))}
                  </div>
                ) : isLargeSection ? (
                  <div className="flex w-full flex-row items-start gap-3 sm:gap-4 lg:items-stretch lg:gap-3">
                    <div className="relative min-w-0 w-full flex-1">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-0">
                        <div>
                          {items.slice(0, midpoint).map((item) => (
                            <MenuItem key={item.id} item={item} showPizzaSizes={hasPizzaRules} />
                          ))}
                        </div>
                        <div>
                          {items.slice(midpoint).map((item) => (
                            <MenuItem key={item.id} item={item} showPizzaSizes={hasPizzaRules} />
                          ))}
                        </div>
                      </div>
                      <CardapioDesktopColumnDivider />
                    </div>
                  </div>
                ) : (
                  <div className="w-full">
                    {items.map((item) => (
                      <MenuItem key={item.id} item={item} showPizzaSizes={hasPizzaRules} />
                    ))}
                  </div>
                )}
                {hasPizzaRules && <PizzaCategoryFooter category={group.category} />}
              </div>
            </section>
          );
        })}

        {groupedProducts.length === 0 && (
          <div className={cn(siteContainerClass, "py-20 text-center text-muted-foreground")}>
            <p className="text-lg">Nenhum item no cardápio ainda.</p>
            <p className="mt-2 text-sm">Acesse o painel administrativo para adicionar produtos.</p>
          </div>
        )}
      </div>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

function PizzaCategoryFooter({
  category,
}: {
  category: {
    footer_note_extra?: string | null;
    footer_note_slices?: string | null;
    footer_note_flour?: string | null;
  };
}) {
  const lines = [category.footer_note_extra, category.footer_note_slices, category.footer_note_flour].filter(
    (line): line is string => !!line?.trim(),
  );

  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="cardapio-section-heading mt-6 w-full border-t border-border/60 pt-4">
      {lines.map((line) => (
        <p key={line} className="text-center text-xs leading-relaxed text-muted-foreground">
          {line}
        </p>
      ))}
    </div>
  );
}

function WineGroupedItems({
  items,
}: {
  items: {
    id: number;
    name: string;
    price: number;
    description?: string | null;
    short_description?: string | null;
    country_origin?: string | null;
    is_house_wine?: boolean;
    price_glass?: number | null;
    price_half_carafe?: number | null;
    price_carafe?: number | null;
  }[];
}) {
  const regularWines = items.filter((item) => !item.is_house_wine);
  const houseWines = items.filter((item) => item.is_house_wine);

  const groupedRegular = regularWines.reduce<Record<string, typeof regularWines>>((acc, item) => {
    const key = item.country_origin?.trim();
    if (!key) {
      return acc;
    }
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  const orderedRegularCountries = Object.keys(groupedRegular).sort((a, b) => a.localeCompare(b));

  return (
    <div className="w-full space-y-8">
      {orderedRegularCountries.map((country) => (
        <div key={country}>
          <h3 className="text-xl md:text-2xl font-bold text-secondary mb-3">{country}</h3>
          <div className="space-y-0">
            {groupedRegular[country].map((item) => (
              <MenuItem key={item.id} item={item} showPizzaSizes={false} />
            ))}
          </div>
        </div>
      ))}
      {houseWines.length > 0 && (
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-secondary mb-3">Vinhos da Casa</h3>
          <div className="space-y-0">
            {houseWines.map((item) => (
              <MenuItem key={item.id} item={item} showPizzaSizes={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  item,
  showPizzaSizes,
}: {
  item: {
    name: string;
    price: number;
    description?: string | null;
    short_description?: string | null;
    is_house_wine?: boolean;
    price_glass?: number | null;
    price_half_carafe?: number | null;
    price_carafe?: number | null;
    pizza_has_broto?: boolean;
    pizza_broto_pricing_mode?: string | null;
    pizza_broto_percentage?: number | null;
    pizza_broto_fixed_price?: number | null;
    pizza_has_mini?: boolean;
    pizza_mini_pricing_mode?: string | null;
    pizza_mini_percentage?: number | null;
    pizza_mini_fixed_price?: number | null;
  };
  showPizzaSizes: boolean;
}) {
  const brotoPrice = pizzaSizePriceFromGrande(
    item.price,
    PIZZA_BROTO_PERCENT_OF_GRANDE,
    item.pizza_has_broto ?? true,
  );
  const miniPrice = pizzaSizePriceFromGrande(
    item.price,
    PIZZA_MINI_PERCENT_OF_GRANDE,
    item.pizza_has_mini ?? true,
  );
  const pizzaSizeLines = [
    brotoPrice !== null ? `Broto (6 pedaços): ${formatCurrency(brotoPrice)}` : null,
    miniPrice !== null ? `Mini (4 pedaços): ${formatCurrency(miniPrice)}` : null,
  ].filter((line): line is string => !!line);
  const hasHouseWinePrices = !!item.is_house_wine && (
    item.price_glass != null ||
    item.price_half_carafe != null ||
    item.price_carafe != null
  );
  const descRaw = item.short_description || item.description;
  const desc = descRaw?.trim() ? descRaw : null;

  return (
    <div className="py-3 border-b border-border/40 last:border-b-0">
      <div className="flex items-baseline gap-2">
        <span className="font-semibold text-foreground text-sm md:text-base">{item.name}</span>
        <span className="flex-1 border-b border-dotted border-muted-foreground/40 min-w-[2rem] translate-y-[-3px]" />
        {hasHouseWinePrices ? (
          <span className="font-semibold text-secondary text-xs md:text-sm whitespace-nowrap">
            valores por medida
          </span>
        ) : showPizzaSizes ? (
          <span className="font-bold text-secondary text-sm md:text-base whitespace-nowrap">
            {formatCurrency(item.price)}
          </span>
        ) : (
          <span className="font-bold text-secondary text-sm md:text-base whitespace-nowrap">
            {formatCurrency(item.price)}
          </span>
        )}
      </div>
      {showPizzaSizes && !hasHouseWinePrices && (
        <>
          {desc && (
            <p className="text-xs text-black mt-1 leading-relaxed">{desc}</p>
          )}
          {pizzaSizeLines.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {pizzaSizeLines.join(" | ")}
            </p>
          )}
        </>
      )}
      {hasHouseWinePrices && (
        <p className="text-xs text-muted-foreground mt-1">
          {item.price_glass !== null && item.price_glass !== undefined ? `Taça: ${formatCurrency(item.price_glass)}` : ""}
          {item.price_glass !== null && item.price_glass !== undefined && (item.price_half_carafe !== null && item.price_half_carafe !== undefined) ? " | " : ""}
          {item.price_half_carafe !== null && item.price_half_carafe !== undefined ? `Meia Jarra: ${formatCurrency(item.price_half_carafe)}` : ""}
          {(item.price_glass !== null && item.price_glass !== undefined || item.price_half_carafe !== null && item.price_half_carafe !== undefined) && (item.price_carafe !== null && item.price_carafe !== undefined) ? " | " : ""}
          {item.price_carafe !== null && item.price_carafe !== undefined ? `Jarra: ${formatCurrency(item.price_carafe)}` : ""}
        </p>
      )}
      {!showPizzaSizes && desc && (
        <p className="text-xs text-black mt-1 leading-relaxed">{desc}</p>
      )}
    </div>
  );
}

export default CardapioPage;
