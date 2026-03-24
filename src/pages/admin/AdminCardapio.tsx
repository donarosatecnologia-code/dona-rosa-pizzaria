import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, Check, ChevronDown, ChevronUp, GripVertical } from "lucide-react";

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
    mutationFn: async (cat: { name: string; slug: string; description?: string }) => {
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
    mutationFn: async ({ id, ...data }: { id: number; name?: string; description?: string; slug?: string }) => {
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
    mutationFn: async (product: { name: string; price: number; category_id: number; slug: string; short_description?: string }) => {
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
    mutationFn: async ({ id, ...data }: { id: number; name?: string; price?: number; short_description?: string }) => {
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
                          <th className="text-left px-4 py-2 font-medium text-foreground text-xs w-24">Preço</th>
                          <th className="text-right px-4 py-2 font-medium text-foreground text-xs w-20">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catProducts.map((p) => (
                          <ProductRow
                            key={p.id}
                            product={p}
                            onDelete={() => deleteProductMutation.mutate(p.id)}
                            onUpdate={(data) => updateProductMutation.mutate({ id: p.id, ...data })}
                          />
                        ))}
                      </tbody>
                    </table>
                    {catProducts.length === 0 && (
                      <p className="text-center text-muted-foreground py-4 text-xs">Nenhum produto nesta categoria.</p>
                    )}
                    <NewProductInlineForm categoryId={cat.id} onSubmit={(p) => createProductMutation.mutate(p)} />
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

function NewCategoryForm({ onSubmit }: { onSubmit: (c: { name: string; slug: string; description?: string }) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

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
      <button
        onClick={() => {
          if (!name) return;
          onSubmit({ name, slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""), description: description || undefined });
        }}
        className="btn-primary-dr text-sm"
      >
        Criar Categoria
      </button>
    </div>
  );
}

function CategoryEditRow({ category, onSave, onCancel }: { category: { name: string; description: string | null }; onSave: (data: { name: string; description?: string; slug: string }) => void; onCancel: () => void }) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description || "");

  return (
    <div className="flex-1 flex items-center gap-2">
      <input value={name} onChange={(e) => setName(e.target.value)} className="px-2 py-1 border border-input rounded text-sm flex-1" />
      <input value={description} onChange={(e) => setDescription(e.target.value)} className="px-2 py-1 border border-input rounded text-sm flex-1" placeholder="Descrição" />
      <button onClick={() => onSave({ name, slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""), description })} className="text-primary p-1">
        <Check size={16} />
      </button>
      <button onClick={onCancel} className="text-muted-foreground p-1">
        <X size={16} />
      </button>
    </div>
  );
}

function NewProductInlineForm({ categoryId, onSubmit }: { categoryId: number; onSubmit: (p: { name: string; price: number; category_id: number; slug: string; short_description?: string }) => void }) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="w-full py-2 text-xs text-primary hover:bg-muted/30 flex items-center justify-center gap-1 border-t border-border">
        <Plus size={14} /> Adicionar produto
      </button>
    );
  }

  return (
    <div className="border-t border-border px-4 py-3 bg-muted/20">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do produto" className="px-2 py-1.5 border border-input rounded text-sm" />
        <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Preço" className="px-2 py-1.5 border border-input rounded text-sm" />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrição curta" className="px-2 py-1.5 border border-input rounded text-sm" />
        <div className="flex gap-1">
          <button
            onClick={() => {
              if (!name || !price) return;
              onSubmit({
                name,
                price: parseFloat(price),
                category_id: categoryId,
                slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
                short_description: desc || undefined,
              });
              setName("");
              setPrice("");
              setDesc("");
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
    </div>
  );
}

function ProductRow({ product, onDelete, onUpdate }: {
  product: { id: number; name: string; price: number; short_description?: string | null; categories: { name: string } | null };
  onDelete: () => void;
  onUpdate: (data: { name?: string; price?: number; short_description?: string }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price.toString());
  const [desc, setDesc] = useState(product.short_description || "");

  if (editing) {
    return (
      <tr className="border-t border-border">
        <td className="px-4 py-2">
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-2 py-1 border border-input rounded text-sm" />
        </td>
        <td className="px-4 py-2">
          <input value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full px-2 py-1 border border-input rounded text-sm" />
        </td>
        <td className="px-4 py-2">
          <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-20 px-2 py-1 border border-input rounded text-sm" />
        </td>
        <td className="px-4 py-2 text-right space-x-1">
          <button onClick={() => { onUpdate({ name, price: parseFloat(price), short_description: desc }); setEditing(false); }} className="text-primary p-1"><Check size={14} /></button>
          <button onClick={() => setEditing(false)} className="text-muted-foreground p-1"><X size={14} /></button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-border hover:bg-muted/30">
      <td className="px-4 py-2 text-foreground text-sm">{product.name}</td>
      <td className="px-4 py-2 text-muted-foreground text-xs">{product.short_description || "—"}</td>
      <td className="px-4 py-2 text-foreground text-sm">R$ {product.price.toFixed(2)}</td>
      <td className="px-4 py-2 text-right space-x-1">
        <button onClick={() => setEditing(true)} className="text-primary p-1"><Pencil size={14} /></button>
        <button onClick={onDelete} className="text-destructive p-1"><Trash2 size={14} /></button>
      </td>
    </tr>
  );
}

export default AdminCardapio;
