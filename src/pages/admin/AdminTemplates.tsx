import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Plus, RefreshCw, Send, Pencil, Loader2, Archive, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TemplateEditorDialog } from "@/components/admin/templates/TemplateEditorDialog";
import { TemplateStatusBadge } from "@/components/admin/templates/TemplateStatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useSubmitWhatsappTemplate,
  useSyncWhatsappTemplates,
  useWhatsappPhoneStatus,
  useWhatsappTemplates,
  useArchiveWhatsappTemplate,
  useDeleteWhatsappTemplateDraft,
} from "@/hooks/whatsapp";
import type { WhatsappTemplate } from "@/integrations/supabase/types/whatsapp-templates";
import { WhatsappMessagePreview } from "@/components/admin/templates/WhatsappMessagePreview";

export default function AdminTemplates() {
  const { data: templates, isLoading, error } = useWhatsappTemplates();
  const submit = useSubmitWhatsappTemplate();
  const sync = useSyncWhatsappTemplates();
  const archive = useArchiveWhatsappTemplate();
  const deleteDraft = useDeleteWhatsappTemplateDraft();
  const { data: phoneStatus } = useWhatsappPhoneStatus();
  const templatesBlockedByMeta = !phoneStatus?.phone?.is_cloud_ready;

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<WhatsappTemplate | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [didAutoSync, setDidAutoSync] = useState(false);

  useEffect(() => {
    if (didAutoSync || isLoading) {
      return;
    }
    setDidAutoSync(true);
    sync.mutate(undefined, {
      onSuccess: (result) => {
        if ((result.imported ?? 0) > 0) {
          toast.success(`${result.imported} modelo(s) importado(s) da Meta.`);
        }
      },
      onError: () => {
        /* silencioso no mount — Rosa usa o botão Atualizar status */
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync once on mount
  }, [didAutoSync, isLoading]);

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(template: WhatsappTemplate) {
    setEditing(template);
    setEditorOpen(true);
  }

  async function handleSubmit(templateId: string) {
    setActionId(templateId);
    try {
      await submit.mutateAsync(templateId);
      toast.success("Modelo enviado para aprovação da Meta!");
      await sync.mutateAsync(undefined);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Não foi possível enviar.";
      toast.error(msg);
    } finally {
      setActionId(null);
    }
  }

  async function handleSync() {
    try {
      const result = await sync.mutateAsync(undefined);
      toast.success(
        result.imported
          ? `${result.imported} importado(s), ${result.updated} atualizado(s).`
          : result.updated > 0
            ? `${result.updated} modelo(s) atualizado(s).`
            : "Nenhuma mudança de status no momento.",
      );
    } catch {
      toast.error("Não foi possível consultar a Meta. Tente de novo em instantes.");
    }
  }

  async function handleArchive(templateId: string) {
    try {
      await archive.mutateAsync(templateId);
      toast.success("Modelo arquivado.");
    } catch {
      toast.error("Não foi possível arquivar.");
    }
  }

  async function handleDeleteDraft(templateId: string) {
    try {
      await deleteDraft.mutateAsync(templateId);
      toast.success("Rascunho excluído.");
    } catch {
      toast.error("Só é possível excluir rascunhos ou modelos rejeitados.");
    }
  }

  const pendingCount = templates?.filter((t) => t.status === "pending").length ?? 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold">Mensagens prontas</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Textos que o WhatsApp precisa aprovar antes de usar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" onClick={handleSync} disabled={sync.isPending}>
            {sync.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar status
              </>
            )}
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo modelo
          </Button>
        </div>
      </div>

      {templatesBlockedByMeta && (
        <Alert className="mb-4 border-amber-300 bg-amber-50 text-amber-950">
          <AlertTitle>Envio à Meta temporariamente bloqueado</AlertTitle>
          <AlertDescription>
            A conta WhatsApp ainda não tem permissão para criar modelos (App Review + coexistência
            pendente). Você pode salvar rascunhos aqui; o botão &quot;Enviar para aprovação&quot; só
            funcionará depois que a Meta aprovar o app e o número estiver em Cloud API.{" "}
            <Link to="/admin/conectar-whatsapp" className="underline font-medium">
              Ver status da conexão
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {pendingCount > 0 && (
        <Alert className="mb-4 border-blue-200 bg-blue-50 text-blue-950">
          <AlertTitle>{pendingCount} modelo(s) aguardando aprovação</AlertTitle>
          <AlertDescription>
            A Meta costuma responder em até 24 horas. Clique em &quot;Atualizar status&quot; para ver se já foi aprovado.
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      )}

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="pt-6 text-sm text-destructive">
            Não foi possível carregar os modelos.
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && (!templates || templates.length === 0) && (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Nenhum modelo ainda</p>
            <p>Crie o primeiro modelo para começar a disparar campanhas.</p>
            <Button className="mt-4" onClick={openCreate}>
              Criar primeiro modelo
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {templates?.map((template) => (
          <Card key={template.id}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{template.display_name}</CardTitle>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{template.name}</p>
                </div>
                <TemplateStatusBadge status={template.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <WhatsappMessagePreview
                body={template.body}
                variables={template.variables ?? []}
              />

              {template.status === "rejected" && template.rejection_reason && (
                <Alert variant="destructive">
                  <AlertTitle>Motivo da reprovação</AlertTitle>
                  <AlertDescription>{template.rejection_reason}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap gap-2">
                {(template.status === "draft" || template.status === "rejected") && (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => openEdit(template)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      disabled={actionId === template.id || templatesBlockedByMeta}
                      title={
                        templatesBlockedByMeta
                          ? "Aguarde App Review e coexistência Cloud API"
                          : undefined
                      }
                      onClick={() => handleSubmit(template.id)}
                    >
                      {actionId === template.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-1" />
                          Enviar para aprovação
                        </>
                      )}
                    </Button>
                  </>
                )}
                {template.status === "approved" && (
                  <>
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/admin/disparos">Usar em campanha</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleArchive(template.id)}
                      disabled={archive.isPending}
                    >
                      <Archive className="h-4 w-4 mr-1" />
                      Arquivar
                    </Button>
                  </>
                )}
                {(template.status === "draft" || template.status === "rejected") && !template.is_meta_imported && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDeleteDraft(template.id)}
                    disabled={deleteDraft.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir rascunho
                  </Button>
                )}
                {template.is_meta_imported && (
                  <p className="text-xs text-muted-foreground w-full">
                    Modelo importado da Meta — exclusão bloqueada. Você pode arquivar.
                  </p>
                )}
                {template.status === "pending" && (
                  <Button size="sm" variant="ghost" onClick={handleSync} disabled={sync.isPending}>
                    Verificar agora
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <TemplateEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editing}
      />
    </div>
  );
}
