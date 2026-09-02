import { Loader2, Tags } from "lucide-react";
import { toast } from "sonner";
import { ContactTagBadge } from "@/components/admin/contatos/ContactTagBadge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToggleContactTag, useWhatsappTags } from "@/hooks/whatsapp/useWhatsappTags";
import { useWhatsappContactTagMap } from "@/hooks/whatsapp/useWhatsappContactTags";
import type { WhatsappContact } from "@/integrations/supabase/types/whatsapp-broadcast";
import {
  canInteractViaWhatsapp,
  isTelefoneFixoContact,
  TELEFONE_FIXO_TAG_COLOR,
  TELEFONE_FIXO_TAG_NAME,
  TELEFONE_FIXO_TAG_SLUG,
} from "@/lib/whatsapp/contactTelefoneFixo";
import { isPurchaseSystemTagSlug } from "@/lib/whatsapp/contactPurchaseTags";

interface ContactTagsEditorProps {
  contact: WhatsappContact;
  compact?: boolean;
  /** Botão largura total — uso em cards mobile */
  fullWidth?: boolean;
}

interface DisplayTag {
  key: string;
  name: string;
  color: string | null;
  readOnly?: boolean;
}

function buildDisplayTags(
  contact: WhatsappContact,
  contactTags: Array<{ tagId: string; slug: string; name: string; color: string | null }>,
  telefoneFixoColor: string | null,
): DisplayTag[] {
  const tags: DisplayTag[] = [];

  if (isTelefoneFixoContact(contact)) {
    tags.push({
      key: TELEFONE_FIXO_TAG_SLUG,
      name: TELEFONE_FIXO_TAG_NAME,
      color: telefoneFixoColor ?? TELEFONE_FIXO_TAG_COLOR,
      readOnly: true,
    });
  }

  for (const tag of contactTags) {
    if (tag.slug === TELEFONE_FIXO_TAG_SLUG || tag.slug === "qa-homologacao") {
      continue;
    }
    tags.push({
      key: tag.tagId,
      name: tag.name,
      color: tag.color,
      readOnly: isPurchaseSystemTagSlug(tag.slug),
    });
  }

  return tags;
}

export function ContactTagsEditor({ contact, compact = false, fullWidth = false }: ContactTagsEditorProps) {
  const { data: allTags } = useWhatsappTags();
  const { data: tagMap } = useWhatsappContactTagMap();
  const toggleTag = useToggleContactTag();

  const contactTags = (tagMap?.get(contact.id) ?? []).filter((t) => t.slug !== "qa-homologacao");
  const contactTagIds = new Set(contactTags.map((t) => t.tagId));
  const telefoneFixoColor =
    allTags?.find((tag) => tag.slug === TELEFONE_FIXO_TAG_SLUG)?.color ?? null;
  const displayTags = buildDisplayTags(contact, contactTags, telefoneFixoColor);
  const whatsappEnabled = canInteractViaWhatsapp(contact);

  const manualTags = (allTags ?? []).filter((t) => !t.is_system);

  async function handleToggle(tagId: string, enabled: boolean) {
    try {
      await toggleTag.mutateAsync({ contactId: contact.id, tagId, enabled });
    } catch {
      toast.error("Não foi possível atualizar a etiqueta.");
    }
  }

  if (compact) {
    return (
      <div className={fullWidth ? "space-y-2" : "flex flex-wrap items-center gap-1"}>
        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(fullWidth ? displayTags : displayTags.slice(0, 3)).map((tag) => (
              <ContactTagBadge key={tag.key} name={tag.name} color={tag.color} />
            ))}
            {!fullWidth && displayTags.length > 3 && (
              <ContactTagBadge name={`+${displayTags.length - 3}`} />
            )}
          </div>
        )}
        {contact.status === "active" && manualTags.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant={fullWidth ? "outline" : "ghost"}
                className={
                  fullWidth
                    ? "min-h-[44px] w-full justify-center text-sm"
                    : "h-7 px-2 text-xs"
                }
              >
                <Tags className={fullWidth ? "h-4 w-4 mr-2" : "h-3 w-3 mr-1"} />
                {fullWidth ? `Etiquetas (${displayTags.length})` : "Etiquetas"}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className={fullWidth ? "w-[min(100vw-2rem,20rem)] p-3" : "w-64 p-3"}
              align="start"
            >
              <TagPickerList
                tags={manualTags}
                contactTagIds={contactTagIds}
                isPending={toggleTag.isPending}
                onToggle={handleToggle}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="min-h-[44px]">
          {toggleTag.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Tags className="h-4 w-4 mr-1" />
              Etiquetas ({displayTags.length})
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <p className="text-xs text-muted-foreground mb-2">
          Etiquetas automáticas (ativo, VIP, etc.) são calculadas pelo sistema. Abaixo, etiquetas manuais.
        </p>
        {!whatsappEnabled && (
          <p className="text-xs text-amber-700 mb-2">
            Contato só para consulta — sem envio via WhatsApp.
          </p>
        )}
        <TagPickerList
          tags={manualTags}
          contactTagIds={contactTagIds}
          isPending={toggleTag.isPending}
          onToggle={handleToggle}
        />
      </PopoverContent>
    </Popover>
  );
}

interface TagPickerListProps {
  tags: Array<{ id: string; name: string; color: string | null }>;
  contactTagIds: Set<string>;
  isPending: boolean;
  onToggle: (tagId: string, enabled: boolean) => void;
}

function TagPickerList({ tags, contactTagIds, isPending, onToggle }: TagPickerListProps) {
  if (tags.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma etiqueta criada ainda. Crie em Etiquetas no menu.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
      {tags.map((tag) => {
        const isOn = contactTagIds.has(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            disabled={isPending}
            onClick={() => onToggle(tag.id, !isOn)}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
          >
            <ContactTagBadge
              name={tag.name}
              color={isOn ? tag.color : null}
              className={isOn ? undefined : "bg-transparent text-foreground border-border border"}
            />
          </button>
        );
      })}
    </div>
  );
}
