import { persistOutboundCrmMessage } from "../_shared/crm-persistence.ts";
import { handleCorsPreflight, jsonWithCors } from "../_shared/cors.ts";
import {
  MetaApiError,
  parseTemplateParams,
  sendWhatsAppTemplate,
} from "../_shared/meta-graph-api.ts";
import { AuthError, createServiceClient, requireAdmin } from "../_shared/supabase-auth.ts";

const DEFAULT_BATCH_LIMIT = 50;

interface BroadcastSendRequest {
  campaign_id?: string;
  limit?: number;
}

interface CampaignRow {
  id: string;
  template_name: string | null;
  template_params: Record<string, unknown> | null;
  queue_id: string | null;
  status: string;
  published_at: string | null;
  total_sent: number;
}

console.info("broadcast-send started");

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) {
    return preflight;
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  try {
    return await handleBroadcastSend(req);
  } catch (error) {
    console.error("broadcast_send_unhandled", error);
    return jsonResponse({ error: "internal_error" }, 500);
  }
});

async function handleBroadcastSend(req: Request): Promise<Response> {
  try {
    await requireAdmin(req);
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonResponse({ error: error.code }, error.status);
    }
    throw error;
  }

  let body: BroadcastSendRequest;
  try {
    body = (await req.json()) as BroadcastSendRequest;
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const campaignId = body.campaign_id?.trim();
  if (!campaignId) {
    return jsonResponse({ error: "campaign_id_required" }, 400);
  }

  const batchLimit = Math.min(Math.max(body.limit ?? DEFAULT_BATCH_LIMIT, 1), 200);
  const isDryRun = Deno.env.get("BROADCAST_DRY_RUN") === "true";

  const accessToken = Deno.env.get("META_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("META_PHONE_NUMBER_ID");

  if (!isDryRun && (!accessToken || !phoneNumberId)) {
    return jsonResponse({ error: "missing_meta_env" }, 500);
  }

  const supabase = createServiceClient();

  const { data: campaign, error: campaignError } = await supabase
    .from("broadcast_campaigns")
    .select("id, template_name, template_params, queue_id, status, published_at, total_sent")
    .eq("id", campaignId)
    .maybeSingle();

  if (campaignError || !campaign) {
    return jsonResponse({ error: "campaign_not_found" }, 404);
  }

  const row = campaign as CampaignRow;
  const validationError = validateCampaignForSend(row);
  if (validationError) {
    return jsonResponse({ error: validationError }, 400);
  }

  await ensureRecipients(supabase, row.id, row.queue_id!);

  const { count: pendingCount } = await supabase
    .from("broadcast_campaign_recipients")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", row.id)
    .eq("send_status", "pending");

  if (row.status === "completed" && (pendingCount ?? 0) === 0) {
    return jsonResponse({ error: "campaign_already_completed" }, 409);
  }

  if (row.status === "draft" || row.status === "completed") {
    await supabase
      .from("broadcast_campaigns")
      .update({ status: "sending", updated_at: new Date().toISOString() })
      .eq("id", row.id);
  }

  const result = await processPendingRecipients(
    supabase,
    row,
    accessToken ?? "",
    phoneNumberId ?? "",
    batchLimit,
    isDryRun,
  );

  return jsonResponse(
    {
      ok: true,
      campaign_id: row.id,
      dry_run: isDryRun,
      ...result,
    },
    200,
  );
}

function validateCampaignForSend(campaign: CampaignRow): string | null {
  if (!campaign.published_at) {
    return "campaign_not_published";
  }
  if (!campaign.template_name?.trim()) {
    return "template_name_missing";
  }
  if (!campaign.queue_id) {
    return "queue_id_missing";
  }
  return null;
}

async function ensureRecipients(
  supabase: ReturnType<typeof createServiceClient>,
  campaignId: string,
  queueId: string,
): Promise<void> {
  const { data: contactIds, error: resolveError } = await supabase.rpc(
    "resolve_queue_contact_ids",
    { p_queue_id: queueId },
  );

  if (resolveError) {
    throw resolveError;
  }

  const ids = (contactIds ?? []) as string[];
  if (ids.length === 0) {
    return;
  }

  const rows = ids.map((contactId) => ({
    campaign_id: campaignId,
    contact_id: contactId,
    send_status: "pending",
  }));

  const { error: insertError } = await supabase
    .from("broadcast_campaign_recipients")
    .upsert(rows, { onConflict: "campaign_id,contact_id", ignoreDuplicates: true });

  if (insertError) {
    throw insertError;
  }
}

async function processPendingRecipients(
  supabase: ReturnType<typeof createServiceClient>,
  campaign: CampaignRow,
  accessToken: string,
  phoneNumberId: string,
  batchLimit: number,
  isDryRun: boolean,
): Promise<{
  sent: number;
  failed: number;
  pending_remaining: number;
  status: string;
}> {
  const { data: pendingRows, error: pendingError } = await supabase
    .from("broadcast_campaign_recipients")
    .select("id, contact_id")
    .eq("campaign_id", campaign.id)
    .eq("send_status", "pending")
    .limit(batchLimit);

  if (pendingError) {
    throw pendingError;
  }

  const contactIds = (pendingRows ?? []).map((row) => row.contact_id);
  const phoneByContactId = new Map<string, string>();
  const termsAcceptedByContactId = new Map<string, boolean>();

  if (contactIds.length > 0) {
    const { data: contacts, error: contactsError } = await supabase
      .from("whatsapp_contacts")
      .select("id, phone_number, terms_accepted_at")
      .in("id", contactIds);

    if (contactsError) {
      throw contactsError;
    }

    for (const contact of contacts ?? []) {
      phoneByContactId.set(contact.id, contact.phone_number);
      termsAcceptedByContactId.set(contact.id, Boolean(contact.terms_accepted_at));
    }
  }

  const templateConfig = parseTemplateParams(campaign.template_params);
  let sent = 0;
  let failed = 0;
  const now = new Date().toISOString();

  for (const row of pendingRows ?? []) {
    const phone = phoneByContactId.get(row.contact_id);
    const hasTerms = termsAcceptedByContactId.get(row.contact_id);

    if (!phone || !hasTerms) {
      await supabase
        .from("broadcast_campaign_recipients")
        .update({ send_status: "failed" })
        .eq("id", row.id);
      failed += 1;
      continue;
    }

    try {
      const messageId = isDryRun
        ? `dry_run_${crypto.randomUUID()}`
        : (await sendWhatsAppTemplate(accessToken, phoneNumberId, {
            to: phone,
            templateName: campaign.template_name!,
            languageCode: templateConfig.languageCode,
            components: templateConfig.components,
          })).messageId;

      await supabase
        .from("broadcast_campaign_recipients")
        .update({
          meta_message_id: messageId,
          send_status: "sent",
          sent_at: now,
        })
        .eq("id", row.id);

      await persistOutboundCrmMessage(supabase, {
        waId: phone,
        metaMessageId: messageId,
        messageType: "template",
        bodyText: campaign.template_name,
        content: {
          template_name: campaign.template_name,
          template_params: campaign.template_params,
        },
        whatsappContactId: row.contact_id,
      });

      await supabase
        .from("whatsapp_contacts")
        .update({ last_outbound_at: now, updated_at: now })
        .eq("id", row.contact_id);

      sent += 1;
    } catch (error) {
      console.error("broadcast_send_failed", {
        recipientId: row.id,
        phone,
        message: error instanceof MetaApiError ? error.message : String(error),
      });

      await supabase
        .from("broadcast_campaign_recipients")
        .update({ send_status: "failed" })
        .eq("id", row.id);

      failed += 1;
    }
  }

  if (sent > 0) {
    await supabase
      .from("broadcast_campaigns")
      .update({
        total_sent: campaign.total_sent + sent,
        updated_at: now,
      })
      .eq("id", campaign.id);
  }

  const { count: pendingRemaining } = await supabase
    .from("broadcast_campaign_recipients")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaign.id)
    .eq("send_status", "pending");

  let status = "sending";
  if ((pendingRemaining ?? 0) === 0) {
    status = "completed";
    await supabase
      .from("broadcast_campaigns")
      .update({ status: "completed", updated_at: now })
      .eq("id", campaign.id);
  }

  return {
    sent,
    failed,
    pending_remaining: pendingRemaining ?? 0,
    status,
  };
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return jsonWithCors(body, status);
}
