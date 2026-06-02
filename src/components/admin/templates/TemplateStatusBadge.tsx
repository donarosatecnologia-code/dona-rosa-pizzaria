import type { WhatsappTemplateStatus } from "@/integrations/supabase/types/whatsapp-templates";
import { Badge } from "@/components/ui/badge";

const STATUS_MAP: Record<
  WhatsappTemplateStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Rascunho", variant: "secondary" },
  pending: { label: "Aguardando aprovação", variant: "outline" },
  approved: { label: "Aprovado", variant: "default" },
  rejected: { label: "Reprovado", variant: "destructive" },
  disabled: { label: "Desativado", variant: "secondary" },
};

interface TemplateStatusBadgeProps {
  status: WhatsappTemplateStatus;
}

export function TemplateStatusBadge({ status }: TemplateStatusBadgeProps) {
  const config = STATUS_MAP[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
