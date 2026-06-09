import { FlaskConical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useQaHomologacaoTag,
  useToggleQaHomologacaoTag,
  useWhatsappContactTagMap,
} from "@/hooks/whatsapp/useWhatsappContactTags";
import type { WhatsappContact } from "@/integrations/supabase/types/whatsapp-broadcast";

interface ContactHomologacaoControlsProps {
  contact: WhatsappContact;
  compact?: boolean;
  fullWidth?: boolean;
}

export function ContactHomologacaoControls({
  contact,
  compact = false,
  fullWidth = false,
}: ContactHomologacaoControlsProps) {
  const { data: tagMap } = useWhatsappContactTagMap();
  const { data: qaTag } = useQaHomologacaoTag();
  const toggleQa = useToggleQaHomologacaoTag();

  const hasQaTag = (tagMap?.get(contact.id) ?? []).some((t) => t.slug === "qa-homologacao");
  const hasTerms = Boolean(contact.terms_accepted_at);

  async function handleToggleQa() {
    if (!qaTag?.id) {
      toast.error("Tag de homologação não encontrada. Rode db:deploy.");
      return;
    }
    if (!hasTerms && !hasQaTag) {
      toast.error("Marque o consentimento LGPD na importação antes de usar em homologação.");
      return;
    }

    try {
      await toggleQa.mutateAsync({
        contactId: contact.id,
        tagId: qaTag.id,
        enabled: !hasQaTag,
      });
      toast.success(hasQaTag ? "Removido da homologação QA." : "Adicionado à homologação QA.");
    } catch {
      toast.error("Não foi possível atualizar a tag.");
    }
  }

  if (compact) {
    return (
      <div className={fullWidth ? "space-y-2" : "flex flex-wrap items-center gap-1.5"}>
        {(hasQaTag || !hasTerms) && (
          <div className="flex flex-wrap gap-1">
            {hasQaTag && (
              <Badge variant="secondary" className="text-[10px]">
                QA
              </Badge>
            )}
            {!hasTerms && (
              <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300">
                Sem LGPD
              </Badge>
            )}
          </div>
        )}
        <Button
          size="sm"
          variant={hasQaTag ? "secondary" : "outline"}
          className={fullWidth ? "min-h-[44px] w-full text-sm" : "h-8 text-xs"}
          disabled={toggleQa.isPending || !qaTag}
          onClick={() => void handleToggleQa()}
        >
          {toggleQa.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <>
              <FlaskConical className="h-3 w-3 mr-1" />
              {hasQaTag ? "Remover QA" : "Marcar QA"}
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {hasQaTag && <Badge variant="secondary">Homologação QA</Badge>}
      {!hasTerms && (
        <Badge variant="outline" className="text-amber-700 border-amber-300">
          Sem consentimento LGPD
        </Badge>
      )}
      <Button
        size="sm"
        variant={hasQaTag ? "secondary" : "outline"}
        className="min-h-[44px]"
        disabled={toggleQa.isPending || !qaTag}
        onClick={() => void handleToggleQa()}
      >
        {toggleQa.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <FlaskConical className="h-4 w-4 mr-1" />
            {hasQaTag ? "Remover de QA" : "Usar em homologação"}
          </>
        )}
      </Button>
    </div>
  );
}
