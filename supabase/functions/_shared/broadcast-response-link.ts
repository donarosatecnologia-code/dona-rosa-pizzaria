import type { SupabaseClient } from "npm:@supabase/supabase-js@2.100.0";

/**
 * Vincula resposta inbound à campanha correta.
 * Prioridade: context.message_id (wamid da mensagem de template) → último recipient enviado.
 */
export async function findCampaignIdForInboundResponse(
  supabase: SupabaseClient,
  contactId: string,
  contextMessageId?: string | null,
): Promise<string | null> {
  const normalizedContextId = contextMessageId?.trim();
  if (normalizedContextId) {
    const { data: byContextAndContact } = await supabase
      .from("broadcast_campaign_recipients")
      .select("campaign_id")
      .eq("meta_message_id", normalizedContextId)
      .eq("contact_id", contactId)
      .maybeSingle();

    if (byContextAndContact?.campaign_id) {
      return byContextAndContact.campaign_id;
    }

    const { data: byContextOnly } = await supabase
      .from("broadcast_campaign_recipients")
      .select("campaign_id")
      .eq("meta_message_id", normalizedContextId)
      .maybeSingle();

    if (byContextOnly?.campaign_id) {
      return byContextOnly.campaign_id;
    }
  }

  const { data: latestRecipient } = await supabase
    .from("broadcast_campaign_recipients")
    .select("campaign_id")
    .eq("contact_id", contactId)
    .in("send_status", ["sent", "delivered", "read"])
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return latestRecipient?.campaign_id ?? null;
}
