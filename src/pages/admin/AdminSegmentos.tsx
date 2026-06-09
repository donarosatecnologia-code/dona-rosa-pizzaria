import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Filter, Plus, Loader2, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminPageShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQueueContactCount } from "@/hooks/whatsapp/useQueueContactCount";
import {
  PROTECTED_QUEUE_SLUGS,
  useDeleteWhatsappQueue,
  useSaveWhatsappQueue,
  useWhatsappQueuesWithTags,
  type QueueWithTags,
} from "@/hooks/whatsapp/useWhatsappQueueMutations";
import { useWhatsappTags } from "@/hooks/whatsapp/useWhatsappTags";

function SegmentContactCount({ queueId }: { queueId: string }) {
  const { data: count, isLoading } = useQueueContactCount(queueId);
  if (isLoading) {
    return <Loader2 className="h-3 w-3 animate-spin inline" />;
  }
  return <span>{count ?? 0} cliente(s)</span>;
}

export default function AdminSegmentos() {
  const { data: queues, isLoading, error } = useWhatsappQueuesWithTags();
  const { data: tags } = useWhatsappTags();
  const saveQueue = useSaveWhatsappQueue();
  const deleteQueue = useDeleteWhatsappQueue();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<QueueWithTags | null>(null);
  const [editing, setEditing] = useState<QueueWithTags | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [includeMatch, setIncludeMatch] = useState<"any" | "all">("any");
  const [includeTagIds, setIncludeTagIds] = useState<string[]>([]);
  const [excludeTagIds, setExcludeTagIds] = useState<string[]>([]);

  const tagById = useMemo(() => new Map((tags ?? []).map((t) => [t.id, t])), [tags]);
  const selectableTags = (tags ?? []).filter((t) => !t.is_system || t.slug.startsWith("cliente-"));

  function openCreate() {
    setEditing(null);
    setName("");
    setDescription("");
    setIncludeMatch("any");
    setIncludeTagIds([]);
    setExcludeTagIds([]);
    setDialogOpen(true);
  }

  function openEdit(queue: QueueWithTags) {
    setEditing(queue);
    setName(queue.name);
    setDescription(queue.description ?? "");
    setIncludeMatch(queue.include_match);
    setIncludeTagIds(queue.includeTagIds);
    setExcludeTagIds(queue.excludeTagIds);
    setDialogOpen(true);
  }

  function toggleTag(list: string[], tagId: string, checked: boolean): string[] {
    if (checked) {
      return [...list, tagId];
    }
    return list.filter((id) => id !== tagId);
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Dê um nome para o segmento.");
      return;
    }
    if (includeTagIds.length === 0) {
      toast.error("Escolha pelo menos uma etiqueta de inclusão.");
      return;
    }
    try {
      await saveQueue.mutateAsync({
        id: editing?.id,
        name,
        description,
        includeMatch,
        includeTagIds,
        excludeTagIds,
      });
      toast.success(editing ? "Segmento atualizado!" : "Segmento criado!");
      setDialogOpen(false);
    } catch {
      toast.error("Não foi possível salvar o segmento.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }
    if (PROTECTED_QUEUE_SLUGS.has(deleteTarget.slug)) {
      toast.error("Este segmento é do sistema e não pode ser excluído.");
      setDeleteTarget(null);
      return;
    }
    try {
      await deleteQueue.mutateAsync(deleteTarget.id);
      toast.success("Segmento excluído.");
      setDeleteTarget(null);
    } catch {
      toast.error("Não foi possível excluir. Verifique se não há campanha usando este segmento.");
    }
  }

  return (
    <AdminPageShell width="lg">
      <AdminPageHeader
        title="Segmentos"
        description="Grupos de clientes definidos por etiquetas. Use nas campanhas de pesquisa e promoções."
        icon={Filter}
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="min-h-[44px] w-full sm:w-auto" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Novo segmento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto w-[calc(100vw-1.5rem)] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? "Editar segmento" : "Novo segmento"}</DialogTitle>
                <DialogDescription>
                  Quem tem as etiquetas marcadas entra no grupo. Você pode excluir quem tem certas etiquetas.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Nome do segmento</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex.: Clientes ativos — Zona Sul"
                    className="min-h-[44px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Para lembrar quando usar"
                    className="min-h-[44px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Incluir clientes que tenham</Label>
                  <Select value={includeMatch} onValueChange={(v) => setIncludeMatch(v as "any" | "all")}>
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Pelo menos uma destas etiquetas</SelectItem>
                      <SelectItem value="all">Todas estas etiquetas</SelectItem>
                    </SelectContent>
                  </Select>
                  <TagCheckboxList
                    tags={selectableTags}
                    selected={includeTagIds}
                    onChange={(tagId, checked) => setIncludeTagIds(toggleTag(includeTagIds, tagId, checked))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Excluir quem tiver (opcional)</Label>
                  <TagCheckboxList
                    tags={selectableTags}
                    selected={excludeTagIds}
                    onChange={(tagId, checked) => setExcludeTagIds(toggleTag(excludeTagIds, tagId, checked))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => void handleSave()} disabled={saveQueue.isPending} className="min-h-[44px]">
                  {saveQueue.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar segmento"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="mb-4 border-dashed max-md:border-0 max-md:bg-muted/30">
        <CardContent className="pt-4 text-sm text-muted-foreground max-md:px-3 max-md:py-3">
          <span className="max-md:block max-md:font-medium max-md:text-foreground max-md:mb-1">
            Como montar um segmento
          </span>
          Primeiro crie{" "}
          <Link to="/admin/etiquetas" className="text-primary hover:underline">
            etiquetas
          </Link>
          , marque nos clientes e depois monte o grupo aqui.
        </CardContent>
      </Card>

      {isLoading && <Skeleton className="h-32 w-full rounded-xl" />}
      {error && (
        <Card className="border-destructive/30">
          <CardContent className="pt-6 text-sm text-destructive">Não foi possível carregar os segmentos.</CardContent>
        </Card>
      )}

      {!isLoading && !error && (
        <>
          <div className="md:hidden space-y-3">
            {(queues ?? []).map((queue) => (
              <Card key={queue.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-base leading-snug">{queue.name}</p>
                      {queue.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {queue.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      <Users className="h-3 w-3 mr-1 inline" />
                      <SegmentContactCount queueId={queue.id} />
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Etiquetas
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {queue.includeTagIds.map((id) => (
                        <Badge key={`m-inc-${id}`} variant="secondary" className="text-[10px]">
                          + {tagById.get(id)?.name ?? id.slice(0, 6)}
                        </Badge>
                      ))}
                      {queue.excludeTagIds.map((id) => (
                        <Badge
                          key={`m-exc-${id}`}
                          variant="outline"
                          className="text-[10px] text-destructive border-destructive/40"
                        >
                          − {tagById.get(id)?.name ?? id.slice(0, 6)}
                        </Badge>
                      ))}
                      {queue.includeTagIds.length === 0 && queue.excludeTagIds.length === 0 && (
                        <span className="text-xs text-muted-foreground">Nenhuma etiqueta</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-[44px] w-full"
                      onClick={() => openEdit(queue)}
                    >
                      Editar segmento
                    </Button>
                    {!PROTECTED_QUEUE_SLUGS.has(queue.slug) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="min-h-[44px] w-full text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(queue)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir segmento
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {(queues ?? []).length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum segmento ainda. Toque em &quot;Novo segmento&quot; acima.
                </CardContent>
              </Card>
            )}
          </div>

          <div className="hidden md:block overflow-x-auto rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Segmento</TableHead>
                <TableHead>Etiquetas</TableHead>
                <TableHead>Clientes</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(queues ?? []).map((queue) => (
                <TableRow key={queue.id}>
                  <TableCell>
                    <p className="font-medium">{queue.name}</p>
                    {queue.description && (
                      <p className="text-xs text-muted-foreground">{queue.description}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {queue.includeTagIds.map((id) => (
                        <Badge key={`inc-${id}`} variant="secondary" className="text-[10px]">
                          + {tagById.get(id)?.name ?? id.slice(0, 6)}
                        </Badge>
                      ))}
                      {queue.excludeTagIds.map((id) => (
                        <Badge key={`exc-${id}`} variant="outline" className="text-[10px] text-destructive">
                          − {tagById.get(id)?.name ?? id.slice(0, 6)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <Users className="h-3 w-3 inline mr-1" />
                    <SegmentContactCount queueId={queue.id} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" className="min-h-[44px]" onClick={() => openEdit(queue)}>
                        Editar
                      </Button>
                      {!PROTECTED_QUEUE_SLUGS.has(queue.slug) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="min-h-[44px] text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(queue)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(queues ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhum segmento ainda. Crie o primeiro para disparar pesquisas segmentadas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        </>
      )}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir segmento?</AlertDialogTitle>
            <AlertDialogDescription>
              O segmento &quot;{deleteTarget?.name}&quot; será removido. Campanhas já criadas com ele não são
              alteradas, mas novos disparos não poderão usar este grupo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteQueue.isPending}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              {deleteQueue.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}

interface TagCheckboxListProps {
  tags: Array<{ id: string; name: string; color: string | null }>;
  selected: string[];
  onChange: (tagId: string, checked: boolean) => void;
}

function TagCheckboxList({ tags, selected, onChange }: TagCheckboxListProps) {
  if (tags.length === 0) {
    return <p className="text-xs text-muted-foreground">Crie etiquetas primeiro.</p>;
  }

  return (
    <div className="space-y-1 max-h-48 overflow-y-auto border rounded-lg p-2 sm:p-3">
      {tags.map((tag) => (
        <label
          key={tag.id}
          className="flex items-center gap-3 text-sm cursor-pointer min-h-[44px] py-1 px-1 rounded-md active:bg-muted/60"
        >
          <Checkbox
            checked={selected.includes(tag.id)}
            onCheckedChange={(checked) => onChange(tag.id, checked === true)}
          />
          <Badge variant="outline" style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}>
            {tag.name}
          </Badge>
        </label>
      ))}
    </div>
  );
}
