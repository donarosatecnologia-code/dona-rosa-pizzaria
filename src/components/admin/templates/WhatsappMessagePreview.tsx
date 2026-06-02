import type { WhatsappTemplateVariable } from "@/integrations/supabase/types/whatsapp-templates";
import { renderTemplatePreview } from "@/integrations/supabase/types/whatsapp-templates";

interface WhatsappMessagePreviewProps {
  body: string;
  variables: WhatsappTemplateVariable[];
}

export function WhatsappMessagePreview({ body, variables }: WhatsappMessagePreviewProps) {
  const preview = renderTemplatePreview(body, variables);

  return (
    <div className="rounded-xl bg-[#0b141a] p-4">
      <p className="text-[10px] text-white/50 mb-3 uppercase tracking-wide">Prévia no WhatsApp</p>
      <div className="max-w-[85%] rounded-lg rounded-tl-none bg-white px-3 py-2 text-sm text-gray-900 shadow-sm whitespace-pre-wrap">
        {preview || "Digite sua mensagem acima..."}
      </div>
    </div>
  );
}
