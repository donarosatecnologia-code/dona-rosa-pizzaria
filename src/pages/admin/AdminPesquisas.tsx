import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, MessageCircle, Pencil, Plus, Send, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SurveyFlowEditorDialog } from "@/components/admin/pesquisas/SurveyFlowEditorDialog";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteSurveyFlow, useSurveyFlows } from "@/hooks/whatsapp";
import type { SurveyFlow, SurveyStep } from "@/integrations/supabase/types/survey-flows";

export default function AdminPesquisas() {
  const { data: flows, isLoading, error } = useSurveyFlows();
  const deleteFlow = useDeleteSurveyFlow();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<SurveyFlow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SurveyFlow | null>(null);

  function openCreate() {
    setEditingFlow(null);
    setEditorOpen(true);
  }

  function openEdit(flow: SurveyFlow) {
    setEditingFlow(flow);
    setEditorOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }
    try {
      await deleteFlow.mutateAsync(deleteTarget.id);
      toast.success("Pesquisa removida.");
      setDeleteTarget(null);
    } catch {
      toast.error("Não foi possível remover a pesquisa.");
    }
  }

  return (
    <AdminPageShell width="lg">
      <AdminPageHeader
        title="Pesquisas no WhatsApp"
        description="Crie, edite e remova pesquisas. O cliente responde direto no chat, sem link."
        icon={ClipboardList}
        actions={
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button onClick={openCreate} className="min-h-[44px] flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2" />
              Nova pesquisa
            </Button>
            <Button asChild variant="secondary" className="min-h-[44px] flex-1 sm:flex-none">
              <Link to="/admin/disparos">
                <Send className="h-4 w-4 mr-2" />
                Criar campanha
              </Link>
            </Button>
          </div>
        }
      />

      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="pt-4 text-sm">
          <p className="font-medium mb-1">Como funciona</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Crie a pesquisa aqui com as perguntas em sequência.</li>
            <li>Dispare um modelo aprovado pela Meta (abre a conversa).</li>
            <li>O sistema manda a introdução e as perguntas, uma por vez.</li>
            <li>As respostas aparecem no relatório da campanha.</li>
          </ol>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      )}

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="pt-6 text-sm text-destructive">
            Não foi possível carregar as pesquisas.
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && (flows ?? []).length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-2">Nenhuma pesquisa ainda</p>
            <p className="mb-4">Crie a primeira pesquisa para enviar aos clientes.</p>
            <Button onClick={openCreate} className="min-h-[44px]">
              <Plus className="h-4 w-4 mr-2" />
              Nova pesquisa
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && (flows ?? []).length > 0 && (
        <div className="space-y-6">
          {(flows ?? []).map((flow) => (
            <Card key={flow.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{flow.name}</CardTitle>
                    {flow.description && (
                      <p className="text-sm text-muted-foreground mt-1">{flow.description}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{flow.steps.length} perguntas</Badge>
                    {flow.suggested_queue_slug && (
                      <Badge variant="outline">Segmento sugerido: {flow.suggested_queue_slug}</Badge>
                    )}
                    <Button size="sm" variant="outline" className="min-h-[44px]" onClick={() => openEdit(flow)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="min-h-[44px] text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(flow)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-3 text-sm whitespace-pre-wrap">
                  <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    Mensagem de abertura (após o modelo)
                  </p>
                  {flow.intro_message}
                </div>
                <ol className="space-y-3">
                  {(flow.steps as SurveyStep[]).map((step, index) => (
                    <li key={step.id} className="text-sm border-l-2 border-primary/30 pl-3">
                      <p className="font-medium">
                        {index + 1}. {step.question}
                      </p>
                      {step.kind === "choice" && step.options && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {step.options.map((opt) => (
                            <Badge key={opt.id} variant="outline" className="text-[10px]">
                              {opt.label}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {step.kind === "text" && (
                        <p className="text-xs text-muted-foreground mt-1">Resposta em texto livre</p>
                      )}
                    </li>
                  ))}
                </ol>
                <Button asChild variant="secondary" size="sm" className="min-h-[44px]">
                  <Link to="/admin/disparos">Usar em campanha</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SurveyFlowEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        flow={editingFlow}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pesquisa?</AlertDialogTitle>
            <AlertDialogDescription>
              A pesquisa &quot;{deleteTarget?.name}&quot; será removida da lista. Campanhas antigas que já usaram
              essa pesquisa continuam com o histórico de respostas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteFlow.isPending}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              {deleteFlow.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}
