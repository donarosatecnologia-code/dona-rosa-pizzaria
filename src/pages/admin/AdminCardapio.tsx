import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, Check, ChevronDown, ChevronUp } from "lucide-react";

const WINE_COUNTRY_OPTIONS = [
  "Argentina",
  "Chile",
  "Portugal",
  "Itália",
  "França",
  "Espanha",
  "Brasil",
  "Uruguai",
];

const DEFAULT_PIZZA_NOTES = {
  footer_note_extra: "Cobertura extra R$ 21,00",
  footer_note_slices: "Nossa pizza 8 pedaços",
  footer_note_flour: "Todas as pizzas são feitas com farinha integral.",
};

function slugify(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function isWineCategory(category: { name: string; slug: string }) {
  return /vinho/i.test(`${category.name} ${category.slug}`);
}

const AdminCardapio = () => {
  const queryClient = useQueryClient();
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, categories(name)").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const toggleCategory = (id: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (cat: {
      name: string;
      slug: string;
      description?: string;
      has_pizza_size_pricing?: boolean;
      footer_note_extra?: string;
      footer_note_slices?: string;
      footer_note_flour?: string;
    }) => {
      const maxOrder = (categories ?? []).reduce((max, c) => Math.max(max, c.sort_order), 0);
      const { error } = await supabase.from("categories").insert({ ...cat, sort_order: maxOrder + 1 });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Categoria criada!");
      setShowCategoryForm(false);
    },
    onError: () => toast.error("Erro ao criar categoria"),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: number;
      name?: string;
      description?: string;
      slug?: string;
      has_pizza_size_pricing?: boolean;
      footer_note_extra?: string | null;
      footer_note_slices?: string | null;
      footer_note_flour?: string | null;
    }) => {
      const { error } = await supabase.from("categories").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Categoria atualizada!");
      setEditingCategoryId(null);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("products").delete().eq("category_id", id);
      if (error) throw error;
      const { error: catError } = await supabase.from("categories").delete().eq("id", id);
      if (catError) throw catError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Categoria e seus produtos removidos!");
    },
  });

  // Product mutations
  const createProductMutation = useMutation({
    mutationFn: async (product: {
      name: string;
      price: number;
      category_id: number;
      slug: string;
      short_description?: string;
      country_origin?: string | null;
      is_house_wine?: boolean;
      price_glass?: number | null;
      price_half_carafe?: number | null;
      price_carafe?: number | null;
    }) => {
      const catProducts = (products ?? []).filter((p) => p.category_id === product.category_id);
      const maxOrder = catProducts.reduce((max, p) => Math.max(max, p.sort_order), 0);
      const { error } = await supabase.from("products").insert({ ...product, sort_order: maxOrder + 1 });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Produto adicionado!");
    },
    onError: () => toast.error("Erro ao criar produto"),
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: number;
      name?: string;
      price?: number;
      short_description?: string;
      country_origin?: string | null;
      is_house_wine?: boolean;
      price_glass?: number | null;
      price_half_carafe?: number | null;
      price_carafe?: number | null;
    }) => {
      const { error } = await supabase.from("products").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Produto atualizado!");
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Produto removido!");
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Gerenciar Cardápio</h1>
        <button onClick={() => setShowCategoryForm(!showCategoryForm)} className="btn-primary-dr flex items-center gap-2 text-sm">
          {showCategoryForm ? <X size={16} /> : <Plus size={16} />}
          {showCategoryForm ? "Cancelar" : "Nova Categoria"}
        </button>
      </div>

      {showCategoryForm && <NewCategoryForm onSubmit={(c) => createCategoryMutation.mutate(c)} />}

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-4">
          {(categories ?? []).map((cat) => {
            const catProducts = (products ?? []).filter((p) => p.category_id === cat.id);
            const isExpanded = expandedCategories.has(cat.id);

            return (
              <div key={cat.id} className="bg-background rounded-xl border border-border overflow-hidden">
                {/* Category header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-muted/50">
                  <button onClick={() => toggleCategory(cat.id)} className="text-muted-foreground">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {editingCategoryId === cat.id ? (
                    <CategoryEditRow
                      category={cat}
                      onSave={(data) => updateCategoryMutation.mutate({ id: cat.id, ...data })}
                      onCancel={() => setEditingCategoryId(null)}
                    />
                  ) : (
                    <>
                      <div className="flex-1">
                        <span className="font-semibold text-foreground">{cat.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">({catProducts.length} itens)</span>
                        {cat.has_pizza_size_pricing && (
                          <span className="text-[10px] font-semibold text-primary ml-2 uppercase tracking-wide">
                            pizza com cálculo de tamanhos
                          </span>
                        )}
                        {cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
                      </div>
                      <button onClick={() => setEditingCategoryId(cat.id)} className="text-primary p-1" title="Editar categoria">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Excluir a categoria "${cat.name}" e todos os seus ${catProducts.length} produtos?`))
                            deleteCategoryMutation.mutate(cat.id);
                        }}
                        className="text-destructive p-1"
                        title="Excluir categoria"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>

                {/* Products table */}
                {isExpanded && (
                  <div>
                    <table className="w-full text-sm">
                      <thead className="bg-muted/30">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium text-foreground text-xs">Nome</th>
                          <th className="text-left px-4 py-2 font-medium text-foreground text-xs">Descrição</th>
                          <th className="text-left px-4 py-2 font-medium text-foreground text-xs w-40">Preço / Variações</th>
                          <th className="text-right px-4 py-2 font-medium text-foreground text-xs w-20">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catProducts.map((p) => (
                          <ProductRow
                            key={p.id}
                            product={p}
                            isWineCategory={isWineCategory(cat)}
                            onDelete={() => deleteProductMutation.mutate(p.id)}
                            onUpdate={(data) => updateProductMutation.mutate({ id: p.id, ...data })}
                          />
                        ))}
                      </tbody>
                    </table>
                    {catProducts.length === 0 && (
                      <p className="text-center text-muted-foreground py-4 text-xs">Nenhum produto nesta categoria.</p>
                    )}
                    <NewProductInlineForm category={cat} onSubmit={(p) => createProductMutation.mutate(p)} />
                  </div>
                )}
              </div>
            );
          })}

          {(!categories || categories.length === 0) && (
            <p className="text-center text-muted-foreground py-8">Nenhuma categoria cadastrada. Clique em "Nova Categoria" para começar.</p>
          )}
        </div>
      )}
    </div>
  );
};

function NewCategoryForm({
  onSubmit,
}: {
  onSubmit: (c: {
    name: string;
    slug: string;
    description?: string;
    has_pizza_size_pricing?: boolean;
    footer_note_extra?: string;
    footer_note_slices?: string;
    footer_note_flour?: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hasPizzaSizePricing, setHasPizzaSizePricing] = useState(false);
  const [footerNoteExtra, setFooterNoteExtra] = useState(DEFAULT_PIZZA_NOTES.footer_note_extra);
  const [footerNoteSlices, setFooterNoteSlices] = useState(DEFAULT_PIZZA_NOTES.footer_note_slices);
  const [footerNoteFlour, setFooterNoteFlour] = useState(DEFAULT_PIZZA_NOTES.footer_note_flour);

  return (
    <div className="bg-background rounded-xl border border-border p-4 mb-4 space-y-3">
      <h3 className="text-sm font-semibold">Nova Categoria</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Nome</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" placeholder="Ex: Pizzas Especiais" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Descrição (opcional)</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" placeholder="Breve descrição" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs font-medium text-foreground">
        <input
          type="checkbox"
          checked={hasPizzaSizePricing}
          onChange={(e) => setHasPizzaSizePricing(e.target.checked)}
          className="rounded border-input"
        />
        Ativar cálculo automático de Pizza Broto (80%) e Mini (65%)
      </label>
      {hasPizzaSizePricing && (
        <div className="grid grid-cols-1 gap-2">
          <input
            value={footerNoteExtra}
            onChange={(e) => setFooterNoteExtra(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            placeholder="Linha 1 do rodapé da seção"
          />
          <input
            value={footerNoteSlices}
            onChange={(e) => setFooterNoteSlices(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            placeholder="Linha 2 do rodapé da seção"
          />
          <input
            value={footerNoteFlour}
            onChange={(e) => setFooterNoteFlour(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            placeholder="Linha 3 do rodapé da seção"
          />
        </div>
      )}
      <button
        onClick={() => {
          if (!name) return;
          onSubmit({
            name,
            slug: slugify(name),
            description: description || undefined,
            has_pizza_size_pricing: hasPizzaSizePricing,
            footer_note_extra: hasPizzaSizePricing ? footerNoteExtra : undefined,
            footer_note_slices: hasPizzaSizePricing ? footerNoteSlices : undefined,
            footer_note_flour: hasPizzaSizePricing ? footerNoteFlour : undefined,
          });
        }}
        className="btn-primary-dr text-sm"
      >
        Criar Categoria
      </button>
    </div>
  );
}

function CategoryEditRow({
  category,
  onSave,
  onCancel,
}: {
  category: {
    name: string;
    description: string | null;
    has_pizza_size_pricing: boolean;
    footer_note_extra: string | null;
    footer_note_slices: string | null;
    footer_note_flour: string | null;
  };
  onSave: (data: {
    name: string;
    description?: string;
    slug: string;
    has_pizza_size_pricing?: boolean;
    footer_note_extra?: string | null;
    footer_note_slices?: string | null;
    footer_note_flour?: string | null;
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description || "");
  const [hasPizzaSizePricing, setHasPizzaSizePricing] = useState(category.has_pizza_size_pricing);
  const [footerNoteExtra, setFooterNoteExtra] = useState(category.footer_note_extra || DEFAULT_PIZZA_NOTES.footer_note_extra);
  const [footerNoteSlices, setFooterNoteSlices] = useState(category.footer_note_slices || DEFAULT_PIZZA_NOTES.footer_note_slices);
  const [footerNoteFlour, setFooterNoteFlour] = useState(category.footer_note_flour || DEFAULT_PIZZA_NOTES.footer_note_flour);

  return (
    <div className="flex-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} className="px-2 py-1 border border-input rounded text-sm" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} className="px-2 py-1 border border-input rounded text-sm" placeholder="Descrição" />
      </div>
      <label className="mt-2 flex items-center gap-2 text-xs font-medium text-foreground">
        <input
          type="checkbox"
          checked={hasPizzaSizePricing}
          onChange={(e) => setHasPizzaSizePricing(e.target.checked)}
          className="rounded border-input"
        />
        Ativar cálculo de tamanhos de pizza
      </label>
      {hasPizzaSizePricing && (
        <div className="mt-2 grid grid-cols-1 gap-2">
          <input value={footerNoteExtra} onChange={(e) => setFooterNoteExtra(e.target.value)} className="px-2 py-1 border border-input rounded text-sm" placeholder="Linha 1 do rodapé" />
          <input value={footerNoteSlices} onChange={(e) => setFooterNoteSlices(e.target.value)} className="px-2 py-1 border border-input rounded text-sm" placeholder="Linha 2 do rodapé" />
          <input value={footerNoteFlour} onChange={(e) => setFooterNoteFlour(e.target.value)} className="px-2 py-1 border border-input rounded text-sm" placeholder="Linha 3 do rodapé" />
        </div>
      )}
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={() =>
            onSave({
              name,
              slug: slugify(name),
              description,
              has_pizza_size_pricing: hasPizzaSizePricing,
              footer_note_extra: hasPizzaSizePricing ? footerNoteExtra : null,
              footer_note_slices: hasPizzaSizePricing ? footerNoteSlices : null,
              footer_note_flour: hasPizzaSizePricing ? footerNoteFlour : null,
            })
          }
          className="text-primary p-1"
        >
          <Check size={16} />
        </button>
        <button onClick={onCancel} className="text-muted-foreground p-1">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

function NewProductInlineForm({
  category,
  onSubmit,
}: {
  category: { id: number; name: string; slug: string };
  onSubmit: (p: {
    name: string;
    price: number;
    category_id: number;
    slug: string;
    short_description?: string;
    country_origin?: string | null;
    is_house_wine?: boolean;
    price_glass?: number | null;
    price_half_carafe?: number | null;
    price_carafe?: number | null;
  }) => void;
}) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [countryOrigin, setCountryOrigin] = useState("");
  const [isHouseWine, setIsHouseWine] = useState(false);
  const [priceGlass, setPriceGlass] = useState("");
  const [priceHalfCarafe, setPriceHalfCarafe] = useState("");
  const [priceCarafe, setPriceCarafe] = useState("");

  const isWine = isWineCategory(category);

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="w-full py-2 text-xs text-primary hover:bg-muted/30 flex items-center justify-center gap-1 border-t border-border">
        <Plus size={14} /> Adicionar produto
      </button>
    );
  }

  return (
    <div className="border-t border-border px-4 py-3 bg-muted/20">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do produto" className="px-2 py-1.5 border border-input rounded text-sm" />
        {!(isWine && isHouseWine) && (
          <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Preço único" className="px-2 py-1.5 border border-input rounded text-sm" />
        )}
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrição curta" className="px-2 py-1.5 border border-input rounded text-sm" />
        <div className="flex gap-1">
          <button
            onClick={() => {
              if (!name) return;
              const parsedPrice = price ? parseFloat(price) : Number.NaN;
              const parsedGlass = priceGlass ? parseFloat(priceGlass) : null;
              const parsedHalf = priceHalfCarafe ? parseFloat(priceHalfCarafe) : null;
              const parsedCarafe = priceCarafe ? parseFloat(priceCarafe) : null;
              if (isWine && isHouseWine && parsedGlass === null && parsedHalf === null && parsedCarafe === null) {
                toast.error("Para vinho da casa, preencha ao menos Taça, Meia Jarra ou Jarra.");
                return;
              }
              if (!isWine || !isHouseWine) {
                if (Number.isNaN(parsedPrice)) {
                  toast.error("Preencha um preço base válido.");
                  return;
                }
              }
              const basePrice = isWine && isHouseWine
                ? (parsedCarafe ?? parsedHalf ?? parsedGlass ?? (Number.isNaN(parsedPrice) ? null : parsedPrice))
                : parsedPrice;
              if (basePrice === null || Number.isNaN(basePrice)) {
                toast.error("Não foi possível calcular o preço base do item.");
                return;
              }
              onSubmit({
                name,
                price: basePrice,
                category_id: category.id,
                slug: slugify(name),
                short_description: desc || undefined,
                country_origin: isWine && !isHouseWine ? (countryOrigin || null) : null,
                is_house_wine: isWine ? isHouseWine : false,
                price_glass: isWine && isHouseWine ? parsedGlass : null,
                price_half_carafe: isWine && isHouseWine ? parsedHalf : null,
                price_carafe: isWine && isHouseWine ? parsedCarafe : null,
              });
              setName("");
              setPrice("");
              setDesc("");
              setCountryOrigin("");
              setIsHouseWine(false);
              setPriceGlass("");
              setPriceHalfCarafe("");
              setPriceCarafe("");
            }}
            className="btn-primary-dr text-xs px-3"
          >
            Adicionar
          </button>
          <button onClick={() => setShow(false)} className="text-muted-foreground text-xs px-2">
            Cancelar
          </button>
        </div>
      </div>
      {isWine && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {!isHouseWine && (
            <>
              <input
                value={countryOrigin}
                onChange={(e) => setCountryOrigin(e.target.value)}
                className="px-2 py-1.5 border border-input rounded text-sm"
                placeholder="País de origem (ex.: Argentina)"
                list="wine-country-options-create"
              />
              <datalist id="wine-country-options-create">
                {WINE_COUNTRY_OPTIONS.map((country) => (
                  <option key={country} value={country} />
                ))}
              </datalist>
            </>
          )}
          <label className="flex items-center gap-2 text-xs font-medium text-foreground px-2">
            <input
              type="checkbox"
              checked={isHouseWine}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsHouseWine(checked);
                if (checked) {
                  setCountryOrigin("");
                }
              }}
              className="rounded border-input"
            />
            Vinho da Casa?
          </label>
          {isHouseWine && (
            <>
              <input value={priceGlass} onChange={(e) => setPriceGlass(e.target.value)} type="number" step="0.01" placeholder="Taça" className="px-2 py-1.5 border border-input rounded text-sm" />
              <input value={priceHalfCarafe} onChange={(e) => setPriceHalfCarafe(e.target.value)} type="number" step="0.01" placeholder="Meia Jarra" className="px-2 py-1.5 border border-input rounded text-sm" />
              <input value={priceCarafe} onChange={(e) => setPriceCarafe(e.target.value)} type="number" step="0.01" placeholder="Jarra" className="px-2 py-1.5 border border-input rounded text-sm" />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ProductRow({
  product,
  isWineCategory,
  onDelete,
  onUpdate,
}: {
  product: {
    id: number;
    name: string;
    price: number;
    short_description?: string | null;
    country_origin?: string | null;
    is_house_wine?: boolean;
    price_glass?: number | null;
    price_half_carafe?: number | null;
    price_carafe?: number | null;
    categories: { name: string } | null;
  };
  isWineCategory: boolean;
  onDelete: () => void;
  onUpdate: (data: {
    name?: string;
    price?: number;
    short_description?: string;
    country_origin?: string | null;
    is_house_wine?: boolean;
    price_glass?: number | null;
    price_half_carafe?: number | null;
    price_carafe?: number | null;
  }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price.toString());
  const [desc, setDesc] = useState(product.short_description || "");
  const [countryOrigin, setCountryOrigin] = useState(product.country_origin || "");
  const [isHouseWine, setIsHouseWine] = useState(!!product.is_house_wine);
  const [priceGlass, setPriceGlass] = useState(product.price_glass?.toString() || "");
  const [priceHalfCarafe, setPriceHalfCarafe] = useState(product.price_half_carafe?.toString() || "");
  const [priceCarafe, setPriceCarafe] = useState(product.price_carafe?.toString() || "");

  if (editing) {
    return (
      <tr className="border-t border-border">
        <td className="px-4 py-2">
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-2 py-1 border border-input rounded text-sm" />
        </td>
        <td className="px-4 py-2">
          <input value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full px-2 py-1 border border-input rounded text-sm" />
          {isWineCategory && (
            <div className="mt-2 space-y-2">
              {!isHouseWine && (
                <>
                  <input
                    value={countryOrigin}
                    onChange={(e) => setCountryOrigin(e.target.value)}
                    className="w-full px-2 py-1 border border-input rounded text-sm"
                    placeholder="País de origem (ex.: Argentina)"
                    list="wine-country-options-edit"
                  />
                  <datalist id="wine-country-options-edit">
                    {WINE_COUNTRY_OPTIONS.map((country) => (
                      <option key={country} value={country} />
                    ))}
                  </datalist>
                </>
              )}
              <label className="flex items-center gap-2 text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={isHouseWine}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsHouseWine(checked);
                    if (checked) {
                      setCountryOrigin("");
                    }
                  }}
                  className="rounded border-input"
                />
                Vinho da Casa?
              </label>
              {isHouseWine && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input value={priceGlass} onChange={(e) => setPriceGlass(e.target.value)} type="number" step="0.01" className="w-full px-2 py-1 border border-input rounded text-sm" placeholder="Taça" />
                  <input value={priceHalfCarafe} onChange={(e) => setPriceHalfCarafe(e.target.value)} type="number" step="0.01" className="w-full px-2 py-1 border border-input rounded text-sm" placeholder="Meia Jarra" />
                  <input value={priceCarafe} onChange={(e) => setPriceCarafe(e.target.value)} type="number" step="0.01" className="w-full px-2 py-1 border border-input rounded text-sm" placeholder="Jarra" />
                </div>
              )}
            </div>
          )}
        </td>
        <td className="px-4 py-2">
          {isWineCategory && isHouseWine ? (
            <span className="text-xs text-muted-foreground">Preço composto</span>
          ) : (
            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-20 px-2 py-1 border border-input rounded text-sm" />
          )}
        </td>
        <td className="px-4 py-2 text-right space-x-1">
          <button
            onClick={() => {
              const parsedPrice = price ? parseFloat(price) : Number.NaN;
              const parsedGlass = priceGlass ? parseFloat(priceGlass) : null;
              const parsedHalf = priceHalfCarafe ? parseFloat(priceHalfCarafe) : null;
              const parsedCarafe = priceCarafe ? parseFloat(priceCarafe) : null;
              if (isWineCategory && isHouseWine && parsedGlass === null && parsedHalf === null && parsedCarafe === null) {
                toast.error("Para vinho da casa, preencha ao menos Taça, Meia Jarra ou Jarra.");
                return;
              }
              if (!isWineCategory || !isHouseWine) {
                if (Number.isNaN(parsedPrice)) {
                  toast.error("Preencha um preço base válido.");
                  return;
                }
              }
              const basePrice = isWineCategory && isHouseWine
                ? (parsedCarafe ?? parsedHalf ?? parsedGlass ?? (Number.isNaN(parsedPrice) ? null : parsedPrice))
                : parsedPrice;
              if (basePrice === null || Number.isNaN(basePrice)) {
                toast.error("Não foi possível calcular o preço base do item.");
                return;
              }
              onUpdate({
                name,
                price: basePrice,
                short_description: desc,
                country_origin: isWineCategory && !isHouseWine ? (countryOrigin || null) : null,
                is_house_wine: isWineCategory ? isHouseWine : false,
                price_glass: isWineCategory && isHouseWine ? parsedGlass : null,
                price_half_carafe: isWineCategory && isHouseWine ? parsedHalf : null,
                price_carafe: isWineCategory && isHouseWine ? parsedCarafe : null,
              });
              setEditing(false);
            }}
            className="text-primary p-1"
          >
            <Check size={14} />
          </button>
          <button onClick={() => setEditing(false)} className="text-muted-foreground p-1"><X size={14} /></button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-border hover:bg-muted/30">
      <td className="px-4 py-2 text-foreground text-sm">{product.name}</td>
      <td className="px-4 py-2 text-muted-foreground text-xs">
        {product.short_description || "—"}
        {isWineCategory && product.country_origin && (
          <div className="text-[11px] mt-1 uppercase tracking-wide text-primary/80">{product.country_origin}</div>
        )}
      </td>
      <td className="px-4 py-2 text-foreground text-xs">
        {product.is_house_wine ? (
          <div className="space-y-1">
            {product.price_glass !== null && product.price_glass !== undefined && <div>Taça: R$ {product.price_glass.toFixed(2)}</div>}
            {product.price_half_carafe !== null && product.price_half_carafe !== undefined && <div>Meia Jarra: R$ {product.price_half_carafe.toFixed(2)}</div>}
            {product.price_carafe !== null && product.price_carafe !== undefined && <div>Jarra: R$ {product.price_carafe.toFixed(2)}</div>}
          </div>
        ) : (
          <span className="text-sm">R$ {product.price.toFixed(2)}</span>
        )}
      </td>
      <td className="px-4 py-2 text-right space-x-1">
        <button onClick={() => setEditing(true)} className="text-primary p-1"><Pencil size={14} /></button>
        <button onClick={onDelete} className="text-destructive p-1"><Trash2 size={14} /></button>
      </td>
    </tr>
  );
}

export default AdminCardapio;
