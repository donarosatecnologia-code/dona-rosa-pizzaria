import type { WhatsappContact } from "@/integrations/supabase/types/whatsapp-broadcast";
import { isLandlineStoredPhone } from "@/lib/whatsapp/normalizePhone";

export const TELEFONE_FIXO_TAG_SLUG = "telefone-fixo";
export const TELEFONE_FIXO_TAG_NAME = "Telefone fixo";
export const TELEFONE_FIXO_TAG_COLOR = "#64748b";

/** Telefone fixo: 10 dígitos nacionais, sem 9 após o DDD. */
export function isTelefoneFixoContact(contact: WhatsappContact): boolean {
  if (contact.inbound_count > 0 || contact.last_inbound_at) {
    return false;
  }

  return isLandlineStoredPhone(contact.phone_number);
}

export function canInteractViaWhatsapp(contact: WhatsappContact): boolean {
  return contact.status === "active" && !isTelefoneFixoContact(contact);
}
