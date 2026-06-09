import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateSurveyFlow,
  useUpdateSurveyFlow,
  useWhatsappQueues,
} from "@/hooks/whatsapp";
import type { SurveyFlow, SurveyStep } from "@/integrations/supabase/types/survey-flows";
import {
  createEmptyStep,
  ensureUniqueOptionIds,
  toOptionId,
  validateSurveyFlow,
} from "@/lib/whatsapp/survey-flow-utils";

interface SurveyFlowEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flow?: SurveyFlow | null;
}

export function SurveyFlowEditorDialog({ open, onOpenChange, flow }: SurveyFlowEditorDialogProps) {
  const { data: queues } = useWhatsappQueues();
  const createFlow = useCreateSurveyFlow();
  const updateFlow = useUpdateSurveyFlow();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [introMessage, setIntroMessage] = useState("");
  const [suggestedQueueSlug, setSuggestedQueueSlug] = useState("");
  const [steps, setSteps] = useState<SurveyStep[]>([createEmptyStep(0)]);

  const isEditing = Boolean(flow);
  const isPending = createFlow.isPending || updateFlow.isPending;

  useEffect(() => {
    if (!open) {
      return;
    }
    if (flow) {
      setName(flow.name);
      setDescription(flow.description ?? "");
      setIntroMessage(flow.intro_message);
      setSuggestedQueueSlug(flow.suggested_queue_slug ?? "");
      setSteps((flow.steps as SurveyStep[]).length > 0 ? (flow.steps as SurveyStep[]) : [createEmptyStep(0)]);
      return;
    }
    setName("");
    setDescription("");
    setIntroMessage(
      "Oi! Tudo bem?\n\nEstamos fazendo uma pesquisa rápida para melhorar a Dona Rosa 🍕\n\nLeva menos de 2 minutos e sua resposta ajuda bastante.\n\nVou te mandar as perguntas aqui mesmo no WhatsApp — é só tocar nas opções ou digitar quando pedir.",
    );
    setSuggestedQueueSlug("");
    setSteps([createEmptyStep(0)]);
  }, [open, flow]);

  function updateStep(index: number, patch: Partial<SurveyStep>) {
    setSteps((prev) =>
      prev.map((step, i) => {
        if (i !== index) {
          return step;
        }
        const next = { ...step, ...patch };
        if (patch.kind === "text") {
          return { id: next.id, question: next.question, kind: "text" };
        }
        if (patch.kind === "choice" && !next.options?.length) {
          return {
            ...next,
            kind: "choice",
            options: [
              { id: "opcao-1", label: "" },
              { id: "opcao-2", label: "" },
            ],
          };
        }
        return next;
      }),
    );
  }

  function moveStep(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= steps.length) {
      return;
    }
    setSteps((prev) => {
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  function removeStep(index: number) {
    if (steps.length <= 1) {
      toast.error("A pesquisa precisa de pelo menos uma pergunta.");
      return;
    }
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }

  function addStep() {
    setSteps((prev) => [...prev, createEmptyStep(prev.length)]);
  }

  function updateOption(stepIndex: number, optionIndex: number, label: string) {
    setSteps((prev) =>
      prev.map((step, i) => {
        if (i !== stepIndex || step.kind !== "choice") {
          return step;
        }
        const options = [...(step.options ?? [])];
        options[optionIndex] = {
          id: options[optionIndex]?.id ?? toOptionId(label, optionIndex + 1),
          label,
        };
        return { ...step, options: ensureUniqueOptionIds(options) };
      }),
    );
  }

  function addOption(stepIndex: number) {
    setSteps((prev) =>
      prev.map((step, i) => {
        if (i !== stepIndex || step.kind !== "choice") {
          return step;
        }
        const options = [...(step.options ?? [])];
        if (options.length >= 10) {
          toast.error("Máximo de 10 opções por pergunta.");
          return step;
        }
        options.push({ id: `opcao-${options.length + 1}`, label: "" });
        return { ...step, options };
      }),
    );
  }

  function removeOption(stepIndex: number, optionIndex: number) {
    setSteps((prev) =>
      prev.map((step, i) => {
        if (i !== stepIndex || step.kind !== "choice") {
          return step;
        }
        const options = (step.options ?? []).filter((_, oi) => oi !== optionIndex);
        return { ...step, options };
      }),
    );
  }

  async function handleSave() {
    const validationError = validateSurveyFlow({
      name,
      intro_message: introMessage,
      steps,
    });
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const payload = {
      name,
      description,
      intro_message: introMessage,
      steps,
      suggested_queue_slug: suggestedQueueSlug || null,
    };

    try {
      if (isEditing && flow) {
        await updateFlow.mutateAsync({ id: flow.id, ...payload });
        toast.success("Pesquisa atualizada!");
      } else {
        await createFlow.mutateAsync(payload);
        toast.success("Pesquisa criada!");
      }
      onOpenChange(false);
    } catch {
      toast.error("Não foi possível salvar a pesquisa.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar pesquisa" : "Nova pesquisa"}</DialogTitle>
          <DialogDescription>
            Monte as perguntas em sequência. O cliente responde direto no WhatsApp, sem link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Nome da pesquisa</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Pesquisa de satisfação delivery"
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Descrição (opcional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Para lembrar quando usar"
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Segmento sugerido (opcional)</Label>
              <Select
                value={suggestedQueueSlug || "__none__"}
                onValueChange={(v) => setSuggestedQueueSlug(v === "__none__" ? "" : v)}
              >
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {queues?.map((q) => (
                    <SelectItem key={q.id} value={q.slug}>
                      {q.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mensagem de abertura</Label>
            <Textarea
              value={introMessage}
              onChange={(e) => setIntroMessage(e.target.value)}
              rows={5}
              placeholder="Texto enviado após o modelo da campanha..."
            />
            <p className="text-xs text-muted-foreground">
              Essa mensagem aparece antes da primeira pergunta.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label>Perguntas ({steps.length})</Label>
              <Button type="button" size="sm" variant="outline" onClick={addStep}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar pergunta
              </Button>
            </div>

            {steps.map((step, stepIndex) => (
              <div key={`${step.id}-${stepIndex}`} className="rounded-lg border p-3 space-y-3 bg-muted/20">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">Pergunta {stepIndex + 1}</p>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      disabled={stepIndex === 0}
                      onClick={() => moveStep(stepIndex, -1)}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      disabled={stepIndex === steps.length - 1}
                      onClick={() => moveStep(stepIndex, 1)}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeStep(stepIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Input
                  value={step.question}
                  onChange={(e) => updateStep(stepIndex, { question: e.target.value })}
                  placeholder="Texto da pergunta"
                  className="min-h-[44px]"
                />

                <Select
                  value={step.kind}
                  onValueChange={(v) => updateStep(stepIndex, { kind: v as "choice" | "text" })}
                >
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="choice">Escolher uma opção</SelectItem>
                    <SelectItem value="text">Digitar resposta (texto livre)</SelectItem>
                  </SelectContent>
                </Select>

                {step.kind === "choice" && (
                  <div className="space-y-2">
                    <Label className="text-xs">Opções de resposta</Label>
                    {(step.options ?? []).map((opt, optIndex) => (
                      <div key={opt.id} className="flex gap-2">
                        <Input
                          value={opt.label}
                          onChange={(e) => updateOption(stepIndex, optIndex, e.target.value)}
                          placeholder={`Opção ${optIndex + 1}`}
                          className="min-h-[44px]"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="shrink-0 text-destructive"
                          disabled={(step.options ?? []).length <= 2}
                          onClick={() => removeOption(stepIndex, optIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => addOption(stepIndex)}
                      disabled={(step.options ?? []).length >= 10}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Opção
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => void handleSave()} disabled={isPending} className="min-h-[44px]">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEditing ? "Salvar alterações" : "Criar pesquisa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
