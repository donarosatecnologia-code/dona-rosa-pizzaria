import { persistOutboundCrmMessage } from "../_shared/crm-persistence.ts";
import { handleCorsPreflight, jsonWithCors } from "../_shared/cors.ts";
import {
  MetaApiError,
  parseTemplateParams,
  sendWhatsAppTemplate,
} from "../_shared/meta-graph-api.ts";
import { startSurveySession } from "../_shared/survey-orchestrator.ts";
import { AuthError, createServiceClient, requireAdmin } from "../_shared/supabase-auth.ts";

const DEFAULT_BATCH_LIMIT = 50;
const MESSAGES_PER_SECOND = 50;
const MIN_SEND_INTERVAL_MS = Math.ceil(1000 / MESSAGES_PER_SECOND);
const MAX_RATE_LIMIT_RETRIES = 3;

interface BroadcastSendRequest {
  campaign_id?: string;
  limit?: number;
}

interface CampaignRow {
  id: string;
  template_name: string | null;
  template_params: Record<string, unknown> | null;
  queue_id: string | null;
  survey_flow_id: string | null;
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
    .select("id, template_name, template_params, queue_id, survey_flow_id, status, published_at, total_sent")
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
  let surveyFlow: {
    id: string;
    slug: string;
    name: string;
    intro_message: string;
    steps: unknown;
  } | null = null;

  if (campaign.survey_flow_id) {
    const { data: flowRow } = await supabase
      .from("survey_flows")
      .select("id, slug, name, intro_message, steps")
      .eq("id", campaign.survey_flow_id)
      .eq("is_active", true)
      .maybeSingle();
    surveyFlow = flowRow;
  }

  const sendContext = {
    accessToken,
    phoneNumberId,
    isDryRun,
  };

  let sent = 0;
  let failed = 0;
  let processed = 0;
  const now = new Date().toISOString();

  for (const row of pendingRows ?? []) {
    if (!isDryRun && processed > 0) {
      await sleep(MIN_SEND_INTERVAL_MS);
    }
    processed += 1;
    const phone = phoneByContactId.get(row.contact_id);
    const hasTerms = termsAcceptedByContactId.get(row.contact_id);

    if (!phone || !hasTerms) {
      const failureReason = !phone
        ? "Telefone do contato não encontrado."
        : "Contato sem consentimento LGPD (terms_accepted_at).";
      await supabase
        .from("broadcast_campaign_recipients")
        .update({ send_status: "failed", failure_reason: failureReason })
        .eq("id", row.id);
      failed += 1;
      continue;
    }

    try {
      const messageId = isDryRun
        ? `dry_run_${crypto.randomUUID()}`
        : (
            await sendWhatsAppTemplateWithRetry(accessToken, phoneNumberId, {
              to: phone,
              templateName: campaign.template_name!,
              languageCode: templateConfig.languageCode,
              components: templateConfig.components,
            })
          ).messageId;

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

      if (surveyFlow) {
        try {
          await startSurveySession(supabase, {
            flow: surveyFlow,
            campaignId: campaign.id,
            contactId: row.contact_id,
            phone,
            send: sendContext,
          });
        } catch (surveyError) {
          console.error("survey_session_start_failed", {
            contactId: row.contact_id,
            message: surveyError instanceof Error ? surveyError.message : String(surveyError),
          });
        }
      }

      sent += 1;
    } catch (error) {
      const failureReason = error instanceof MetaApiError
        ? formatMetaSendFailure(error)
        : String(error);

      console.error("broadcast_send_failed", {
        recipientId: row.id,
        phone,
        message: failureReason,
      });

      await supabase
        .from("broadcast_campaign_recipients")
        .update({ send_status: "failed", failure_reason: failureReason })
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

function formatMetaSendFailure(error: MetaApiError): string {
  const message = error.message;

  if (message.includes("does not exist") || error.metaCode === 132001) {
    return "Template não encontrado ou não aprovado na Meta — crie e submeta em /admin/templates.";
  }

  if (error.status === 403 || error.metaCode === 10 || error.metaCode === 190) {
    return "Permissão negada pela Meta (App Review ou token inválido).";
  }

  if (error.status === 429 || error.metaCode === 130429) {
    return "Rate limit da Meta — tente novamente em alguns minutos.";
  }

  return message;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendWhatsAppTemplateWithRetry(
  accessToken: string,
  phoneNumberId: string,
  options: Parameters<typeof sendWhatsAppTemplate>[2],
): Promise<{ messageId: string }> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
    try {
      return await sendWhatsAppTemplate(accessToken, phoneNumberId, options);
    } catch (error) {
      lastError = error;
      const isRateLimited = error instanceof MetaApiError && error.status === 429;
      if (!isRateLimited || attempt === MAX_RATE_LIMIT_RETRIES) {
        throw error;
      }

      const backoffMs = Math.min(1000 * 2 ** attempt, 8000);
      console.warn("broadcast_send_rate_limited", {
        attempt: attempt + 1,
        backoffMs,
        phone: options.to,
      });
      await sleep(backoffMs);
    }
  }

  throw lastError;
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return jsonWithCors(body, status);
}
