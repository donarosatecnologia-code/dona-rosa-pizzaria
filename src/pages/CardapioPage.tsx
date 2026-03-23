import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import alecrim from "@/assets/alecrim.png";
import tomilho from "@/assets/tomilho.png";

const CardapioPage = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const { data: categories } = useQuery({
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

  const { data: products } = useQuery({
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

  const groupedProducts = (categories ?? []).map((cat) => ({
    category: cat,
    items: (products ?? []).filter((p) => p.category_id === cat.id),
  })).filter((g) => g.items.length > 0);

  const scrollToCategory = (slug: string) => {
    const el = categoryRefs.current[slug];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Intersection observer for active anchor
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id.replace("cat-", ""));
          }
        }
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0 }
    );

    Object.values(categoryRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [groupedProducts]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero banner */}
      <div className="pt-16 section-paper">
        <div className="container mx-auto px-4 py-12 md:py-16 text-center relative overflow-hidden">
          <img src={alecrim} alt="" className="absolute left-0 top-0 h-32 opacity-20 pointer-events-none hidden lg:block" />
          <img src={tomilho} alt="" className="absolute right-0 bottom-0 h-28 opacity-20 pointer-events-none hidden lg:block" />
          <h1 className="text-4xl md:text-5xl font-bold text-secondary mb-3">Nosso Cardápio</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Pratos preparados com ingredientes selecionados e muito carinho artesanal.
          </p>
        </div>
      </div>

      {/* Category anchor nav */}
      <nav className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
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
          const isLargeSection = items.length > 8;
          const midpoint = Math.ceil(items.length / 2);

          return (
            <section
              key={group.category.id}
              id={`cat-${group.category.slug}`}
              ref={(el) => { categoryRefs.current[group.category.slug] = el; }}
              className={`py-12 md:py-16 ${usePaper ? "section-paper" : "bg-background"} relative overflow-hidden`}
            >
              <div className="container mx-auto px-4">
                {/* Category title */}
                <div className="text-center mb-10">
                  <h2 className="text-3xl md:text-4xl font-bold text-secondary inline-block relative">
                    {group.category.name}
                    <span className="block w-16 h-0.5 bg-primary mx-auto mt-3" />
                  </h2>
                  {group.category.description && (
                    <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-sm">
                      {group.category.description}
                    </p>
                  )}
                </div>

                {/* Items grid */}
                {isLargeSection ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-0">
                    <div>
                      {items.slice(0, midpoint).map((item) => (
                        <MenuItem key={item.id} item={item} />
                      ))}
                    </div>
                    <div className="hidden lg:block absolute left-1/2 top-24 bottom-8 w-px bg-border/60" />
                    <div>
                      {items.slice(midpoint).map((item) => (
                        <MenuItem key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto">
                    {items.map((item) => (
                      <MenuItem key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        })}

        {groupedProducts.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">Nenhum item no cardápio ainda.</p>
            <p className="text-sm mt-2">Acesse o painel administrativo para adicionar produtos.</p>
          </div>
        )}
      </div>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

function MenuItem({ item }: { item: { name: string; price: number; description?: string | null; short_description?: string | null } }) {
  return (
    <div className="py-3 border-b border-border/40 last:border-b-0">
      <div className="flex items-baseline gap-2">
        <span className="font-semibold text-foreground text-sm md:text-base">{item.name}</span>
        <span className="flex-1 border-b border-dotted border-muted-foreground/40 min-w-[2rem] translate-y-[-3px]" />
        <span className="font-bold text-secondary text-sm md:text-base whitespace-nowrap">
          R$ {item.price.toFixed(2)}
        </span>
      </div>
      {(item.short_description || item.description) && (
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {item.short_description || item.description}
        </p>
      )}
    </div>
  );
}

export default CardapioPage;
