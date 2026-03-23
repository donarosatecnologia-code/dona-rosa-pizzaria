import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/storage";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, Check } from "lucide-react";

const AdminCardapio = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

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

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Produto removido!");
    },
  });

  const createMutation = useMutation({
    mutationFn: async (product: { name: string; price: number; category_id: number; slug: string; description?: string; image_url?: string }) => {
      const { error } = await supabase.from("products").insert(product);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Produto adicionado!");
      setShowForm(false);
    },
    onError: () => toast.error("Erro ao criar produto"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; name?: string; price?: number; description?: string; image_url?: string }) => {
      const { error } = await supabase.from("products").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Produto atualizado!");
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">Gerenciar Cardápio</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary-dr flex items-center gap-2">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancelar" : "Novo Produto"}
        </button>
      </div>

      {showForm && (
        <NewProductForm
          categories={categories ?? []}
          onSubmit={(p) => createMutation.mutate(p)}
        />
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-foreground">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-foreground">Categoria</th>
                <th className="text-left px-4 py-3 font-medium text-foreground">Preço</th>
                <th className="text-right px-4 py-3 font-medium text-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products?.map((p) => (
                <ProductRow key={p.id} product={p} onDelete={() => deleteMutation.mutate(p.id)} onUpdate={(data) => updateMutation.mutate({ id: p.id, ...data })} />
              ))}
            </tbody>
          </table>
          {(!products || products.length === 0) && (
            <p className="text-center text-muted-foreground py-8">Nenhum produto cadastrado.</p>
          )}
        </div>
      )}
    </div>
  );
};

function NewProductForm({
  categories,
  onSubmit,
}: {
  categories: { id: number; name: string }[];
  onSubmit: (p: { name: string; price: number; category_id: number; slug: string }) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? 0);

  return (
    <div className="bg-background rounded-xl border border-border p-6 mb-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Nome</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Preço (R$)</label>
          <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Categoria</label>
          <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
      <button
        onClick={() => {
          if (!name || !price) return;
          onSubmit({ name, price: parseFloat(price), category_id: categoryId, slug: name.toLowerCase().replace(/\s+/g, "-") });
        }}
        className="btn-primary-dr"
      >
        Adicionar
      </button>
    </div>
  );
}

function ProductRow({
  product,
  onDelete,
  onUpdate,
}: {
  product: { id: number; name: string; price: number; categories: { name: string } | null };
  onDelete: () => void;
  onUpdate: (data: { name?: string; price?: number }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price.toString());

  if (editing) {
    return (
      <tr className="border-t border-border">
        <td className="px-4 py-2">
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-2 py-1 border border-input rounded text-sm" />
        </td>
        <td className="px-4 py-2 text-muted-foreground">{product.categories?.name}</td>
        <td className="px-4 py-2">
          <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-20 px-2 py-1 border border-input rounded text-sm" />
        </td>
        <td className="px-4 py-2 text-right space-x-1">
          <button onClick={() => { onUpdate({ name, price: parseFloat(price) }); setEditing(false); }} className="text-primary p-1"><Check size={16} /></button>
          <button onClick={() => setEditing(false)} className="text-muted-foreground p-1"><X size={16} /></button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-border hover:bg-muted/50">
      <td className="px-4 py-3 text-foreground">{product.name}</td>
      <td className="px-4 py-3 text-muted-foreground">{product.categories?.name}</td>
      <td className="px-4 py-3 text-foreground">R$ {product.price.toFixed(2)}</td>
      <td className="px-4 py-3 text-right space-x-1">
        <button onClick={() => setEditing(true)} className="text-primary p-1"><Pencil size={16} /></button>
        <button onClick={onDelete} className="text-destructive p-1"><Trash2 size={16} /></button>
      </td>
    </tr>
  );
}

export default AdminCardapio;
