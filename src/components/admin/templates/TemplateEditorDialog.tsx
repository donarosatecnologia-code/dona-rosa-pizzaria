import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { WhatsappMessagePreview } from "@/components/admin/templates/WhatsappMessagePreview";
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
import { useCreateWhatsappTemplate, useUpdateWhatsappTemplate } from "@/hooks/whatsapp";
import type {
  WhatsappTemplate,
  WhatsappTemplateCategory,
  WhatsappTemplateVariable,
} from "@/integrations/supabase/types/whatsapp-templates";
import { extractVariablesFromBody } from "@/integrations/supabase/types/whatsapp-templates";

interface TemplateEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: WhatsappTemplate | null;
}

export function TemplateEditorDialog({ open, onOpenChange, template }: TemplateEditorDialogProps) {
  const create = useCreateWhatsappTemplate();
  const update = useUpdateWhatsappTemplate();

  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState<WhatsappTemplateCategory>("UTILITY");
  const [body, setBody] = useState("");
  const [variables, setVariables] = useState<WhatsappTemplateVariable[]>([]);

  const isLocked = template?.status === "pending" || template?.status === "approved";
  const isEdit = Boolean(template);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (template) {
      setDisplayName(template.display_name);
      setCategory(template.category);
      setBody(template.body);
      setVariables(template.variables ?? []);
    } else {
      setDisplayName("");
      setCategory("UTILITY");
      setBody("");
      setVariables([]);
    }
  }, [open, template]);

  useEffect(() => {
    setVariables(extractVariablesFromBody(body));
  }, [body]);

  function updateVariableExample(index: number, example: string) {
    setVariables((prev) =>
      prev.map((v) => (v.index === index ? { ...v, example } : v)),
    );
  }

  async function handleSave() {
    if (!displayName.trim() || !body.trim()) {
      return;
    }

    if (isEdit && template) {
      await update.mutateAsync({
        id: template.id,
        display_name: displayName,
        category,
        body,
        variables,
      });
    } else {
      await create.mutateAsync({
        display_name: displayName,
        category,
        body,
        variables,
      });
    }

    onOpenChange(false);
  }

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar modelo" : "Novo modelo de mensagem"}</DialogTitle>
          <DialogDescription>
            Escreva a mensagem como aparecerá para o cliente. Use {"{{1}}"} para personalizar com o nome.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display-name">Nome do modelo</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Promoção de fim de semana"
              disabled={isLocked}
            />
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as WhatsappTemplateCategory)}
              disabled={isLocked}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTILITY">Utilidade (avisos, confirmações)</SelectItem>
                <SelectItem value="MARKETING">Marketing (promoções)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Texto da mensagem</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              maxLength={1024}
              disabled={isLocked}
              placeholder="Olá {{1}}! Temos novidades especiais para você na Dona Rosa 🍕"
            />
            <p className="text-xs text-muted-foreground text-right">{body.length}/1024</p>
          </div>

          {variables.length > 0 && (
            <div className="space-y-2">
              <Label>Exemplos para aprovação da Meta</Label>
              {variables.map((v) => (
                <div key={v.index} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-8">{`{{${v.index}}}`}</span>
                  <Input
                    value={v.example}
                    onChange={(e) => updateVariableExample(v.index, e.target.value)}
                    disabled={isLocked}
                  />
                </div>
              ))}
            </div>
          )}

          <WhatsappMessagePreview body={body} variables={variables} />
        </div>

        <DialogFooter>
          {!isLocked && (
            <Button onClick={handleSave} disabled={isPending || !displayName.trim() || !body.trim()}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar rascunho
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
