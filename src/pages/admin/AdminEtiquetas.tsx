import { useState } from "react";
import { Tag, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCreateWhatsappTag, useDeleteWhatsappTag, useWhatsappTags } from "@/hooks/whatsapp/useWhatsappTags";

const TAG_COLORS = ["#64748b", "#16a34a", "#2563eb", "#ca8a04", "#dc2626", "#9333ea", "#0891b2"];

export default function AdminEtiquetas() {
  const { data: tags, isLoading, error } = useWhatsappTags();
  const createTag = useCreateWhatsappTag();
  const deleteTag = useDeleteWhatsappTag();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(TAG_COLORS[0]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const manualTags = (tags ?? []).filter((t) => !t.is_system);

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Dê um nome para a etiqueta.");
      return;
    }
    try {
      await createTag.mutateAsync({ name, description, color });
      toast.success("Etiqueta criada!");
      setDialogOpen(false);
      setName("");
      setDescription("");
      setColor(TAG_COLORS[0]);
    } catch {
      toast.error("Não foi possível criar. Talvez já exista uma com nome parecido.");
    }
  }

  async function handleDelete(tagId: string, tagName: string) {
    if (!window.confirm(`Remover a etiqueta "${tagName}"? Ela sai dos clientes e segmentos.`)) {
      return;
    }
    setDeletingId(tagId);
    try {
      await deleteTag.mutateAsync(tagId);
      toast.success("Etiqueta removida.");
    } catch {
      toast.error("Não foi possível remover.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminPageShell width="lg">
      <AdminPageHeader
        title="Etiquetas"
        description="Organize seus clientes com etiquetas coloridas. Use depois para criar segmentos e campanhas."
        icon={Tag}
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="min-h-[44px]">
                <Plus className="h-4 w-4 mr-2" />
                Nova etiqueta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nova etiqueta</DialogTitle>
                <DialogDescription>
                  Exemplos: &quot;Cliente VIP&quot;, &quot;Zona Sul&quot;, &quot;Pediu no mês&quot;.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="tag-name">Nome</Label>
                  <Input
                    id="tag-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex.: Cliente frequente"
                    className="min-h-[44px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tag-desc">Descrição (opcional)</Label>
                  <Input
                    id="tag-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Para lembrar o que significa"
                    className="min-h-[44px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex flex-wrap gap-2">
                    {TAG_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`h-8 w-8 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`}
                        style={{ backgroundColor: c }}
                        aria-label={`Cor ${c}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => void handleCreate()} disabled={createTag.isPending} className="min-h-[44px]">
                  {createTag.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar etiqueta"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      )}

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="pt-6 text-sm text-destructive">
            Não foi possível carregar as etiquetas.
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && (
        <>
          {manualTags.length > 0 && (
            <div className="overflow-x-auto rounded-xl border bg-white mb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Etiqueta</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manualTags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell>
                        <Badge style={{ backgroundColor: tag.color ?? undefined }}>{tag.name}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {tag.description ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive min-h-[44px]"
                          disabled={deletingId === tag.id}
                          onClick={() => void handleDelete(tag.id, tag.name)}
                        >
                          {deletingId === tag.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium mb-2">Etiquetas automáticas do sistema</p>
              <p className="text-xs text-muted-foreground mb-3">
                São aplicadas sozinhas quando o cliente responde pesquisas ou pela rotina de engajamento.
              </p>
              <div className="flex flex-wrap gap-2">
                {(tags ?? [])
                  .filter((t) => t.is_system)
                  .map((tag) => (
                    <Badge key={tag.id} variant="outline">
                      {tag.name}
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </AdminPageShell>
  );
}
