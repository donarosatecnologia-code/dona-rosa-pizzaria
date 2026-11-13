import type { SupabaseClient } from "npm:@supabase/supabase-js@2.100.0";
import {
  sendWhatsAppInteractiveButtons,
  sendWhatsAppInteractiveList,
  sendWhatsAppText,
} from "./meta-graph-api.ts";
import type { MetaWebhookMessage } from "./meta-webhook.ts";
import {
  extractResponseLabel,
  extractResponseValue,
  isInteractiveChoiceReply,
} from "./meta-webhook.ts";
import { persistOutboundCrmMessage } from "./crm-persistence.ts";
import {
  parseSurveySteps,
  type SurveyFlowRow,
  type SurveySessionRow,
  type SurveyStep,
} from "./survey-types.ts";

export interface SurveySendContext {
  accessToken: string;
  phoneNumberId: string;
  isDryRun: boolean;
}

function stepLabel(step: SurveyStep, optionIdOrLabel: string): string | null {
  const normalized = optionIdOrLabel.trim().toLowerCase();
  const match = step.options?.find(
    (o) => o.id === optionIdOrLabel || o.label.toLowerCase() === normalized,
  );
  return match?.label ?? null;
}

function matchChoiceOption(step: SurveyStep, raw: string) {
  const trimmed = raw.trim();
  const normalized = trimmed.toLowerCase();
  return (
    step.options?.find(
      (o) => o.id === trimmed || o.label.toLowerCase() === normalized,
    ) ?? null
  );
}

function formatQuestionBody(step: SurveyStep, stepNumber: number, total: number): string {
  return `*Pergunta ${stepNumber} de ${total}*\n\n${step.question}`;
}

function normalizeSurveyResponseType(message: MetaWebhookMessage, stepKind: "choice" | "text"): string {
  if (stepKind === "text") {
    return "text";
  }
  if (message.type === "interactive" && message.interactive?.list_reply) {
    return "list";
  }
  if (
    message.type === "button" ||
    (message.type === "interactive" && message.interactive?.button_reply)
  ) {
    return "button";
  }
  return "choice";
}

/** Envia intro + inicia sessão (após template da campanha). */
export async function startSurveySession(
  supabase: SupabaseClient,
  input: {
    flow: SurveyFlowRow;
    campaignId: string;
    contactId: string;
    phone: string;
    send: SurveySendContext;
  },
): Promise<"started" | "already_active" | "no_steps" | "failed"> {
  const steps = parseSurveySteps(input.flow.steps);
  if (steps.length === 0) {
    return "no_steps";
  }

  // Nunca reinicia sessão ativa — evita intro + 1ª pergunta duplicados.
  const { data: existingForCampaign } = await supabase
    .from("survey_sessions")
    .select("id")
    .eq("campaign_id", input.campaignId)
    .eq("contact_id", input.contactId)
    .eq("status", "in_progress")
    .maybeSingle();

  if (existingForCampaign) {
    console.info("survey_session_already_in_progress", {
      contactId: input.contactId,
      campaignId: input.campaignId,
      sessionId: existingForCampaign.id,
    });
    return "already_active";
  }

  const { data: existingAny } = await supabase
    .from("survey_sessions")
    .select("id")
    .eq("contact_id", input.contactId)
    .eq("status", "in_progress")
    .maybeSingle();

  if (existingAny) {
    console.info("survey_session_other_in_progress", {
      contactId: input.contactId,
      sessionId: existingAny.id,
    });
    return "already_active";
  }

  const now = new Date().toISOString();
  const { data: session, error } = await supabase
    .from("survey_sessions")
    .insert({
      flow_id: input.flow.id,
      campaign_id: input.campaignId,
      contact_id: input.contactId,
      current_step_index: 0,
      status: "in_progress",
      started_at: now,
      updated_at: now,
    })
    .select("id, flow_id, campaign_id, contact_id, current_step_index, status")
    .single();

  if (error || !session) {
    // Corrida: outro processo criou a sessão no meio do caminho.
    if (error?.code === "23505") {
      console.info("survey_session_start_race_deduped", {
        contactId: input.contactId,
        campaignId: input.campaignId,
      });
      return "already_active";
    }
    console.error("survey_session_start_failed", error?.message);
    return "failed";
  }

  await sendPlainMessage(supabase, {
    phone: input.phone,
    contactId: input.contactId,
    body: input.flow.intro_message,
    send: input.send,
    label: "survey_intro",
  });

  await sendSurveyStep(supabase, {
    session: session as SurveySessionRow,
    flow: input.flow,
    phone: input.phone,
    send: input.send,
  });

  return "started";
}

/**
 * Após o cliente responder o template da campanha (abre janela 24h),
 * inicia a pesquisa se ainda não tiver sido iniciada/concluída.
 */
export async function maybeStartSurveyAfterCampaignReply(
  supabase: SupabaseClient,
  input: {
    contactId: string;
    phone: string;
    contextMessageId?: string | null;
    send: SurveySendContext;
  },
): Promise<boolean> {
  const { data: recipient } = await findSurveyCampaignRecipient(
    supabase,
    input.contactId,
    input.contextMessageId,
  );

  if (!recipient?.campaign_id || !recipient.survey_flow_id) {
    return false;
  }

  const { data: completed } = await supabase
    .from("survey_sessions")
    .select("id")
    .eq("campaign_id", recipient.campaign_id)
    .eq("contact_id", input.contactId)
    .eq("status", "completed")
    .maybeSingle();

  if (completed) {
    return false;
  }

  const { data: inProgress } = await supabase
    .from("survey_sessions")
    .select("id")
    .eq("contact_id", input.contactId)
    .eq("status", "in_progress")
    .maybeSingle();

  if (inProgress) {
    return false;
  }

  const { data: flow } = await supabase
    .from("survey_flows")
    .select("id, slug, name, intro_message, steps")
    .eq("id", recipient.survey_flow_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!flow) {
    return false;
  }

  const outcome = await startSurveySession(supabase, {
    flow: flow as SurveyFlowRow,
    campaignId: recipient.campaign_id,
    contactId: input.contactId,
    phone: input.phone,
    send: input.send,
  });

  if (outcome !== "started") {
    return false;
  }

  console.info("survey_started_after_template_reply", {
    contactId: input.contactId,
    campaignId: recipient.campaign_id,
  });

  return true;
}

async function findSurveyCampaignRecipient(
  supabase: SupabaseClient,
  contactId: string,
  contextMessageId?: string | null,
): Promise<{ campaign_id: string; survey_flow_id: string } | null> {
  const normalizedContextId = contextMessageId?.trim();
  if (!normalizedContextId) {
    // Sem reply ao template da pesquisa: não inicia pesquisa.
    // Evita que um "oi" / pedido após outra mensagem ativa dispare intro + Q1.
    return null;
  }

  const { data: byContext } = await supabase
    .from("broadcast_campaign_recipients")
    .select("campaign_id")
    .eq("meta_message_id", normalizedContextId)
    .eq("contact_id", contactId)
    .maybeSingle();

  const campaignId = byContext?.campaign_id ?? null;
  if (!campaignId) {
    return null;
  }

  const { data: campaign } = await supabase
    .from("broadcast_campaigns")
    .select("id, survey_flow_id")
    .eq("id", campaignId)
    .maybeSingle();

  if (!campaign?.survey_flow_id) {
    return null;
  }

  return {
    campaign_id: campaign.id,
    survey_flow_id: campaign.survey_flow_id,
  };
}

/**
 * Envia intro + 1ª pergunta para destinatários com janela Meta 24h aberta.
 * Opcionalmente restringe a contactIds (seleção / envio individual).
 * Não reinicia quem já tem sessão in_progress.
 */
export async function startSurveysForOpenWindowRecipients(
  supabase: SupabaseClient,
  input: {
    campaignId: string;
    flow: SurveyFlowRow;
    send: SurveySendContext;
    limit: number;
    contactIds?: string[];
  },
): Promise<{ started: number; failed: number; skipped: number; remaining: number }> {
  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const requestedIds = (input.contactIds ?? [])
    .map((id) => id.trim())
    .filter(Boolean);

  // Busca quem tem janela 24h aberta (e, se houver, só os IDs pedidos).
  let contactsQuery = supabase
    .from("whatsapp_contacts")
    .select("id, phone_number, last_inbound_at, status")
    .eq("status", "active")
    .gte("last_inbound_at", windowStart);

  if (requestedIds.length > 0) {
    contactsQuery = contactsQuery.in("id", requestedIds.slice(0, 200));
  } else {
    contactsQuery = contactsQuery
      .order("last_inbound_at", { ascending: false })
      .limit(500);
  }

  const { data: openContacts } = await contactsQuery;
  const contactById = new Map((openContacts ?? []).map((c) => [c.id, c]));
  const openContactIds = [...contactById.keys()];

  if (openContactIds.length === 0) {
    return { started: 0, failed: 0, skipped: 0, remaining: 0 };
  }

  const { data: recipients } = await supabase
    .from("broadcast_campaign_recipients")
    .select("id, contact_id")
    .eq("campaign_id", input.campaignId)
    .in("send_status", ["sent", "delivered", "read"])
    .in("contact_id", openContactIds);

  const eligible = (recipients ?? []).filter((r) => contactById.has(r.contact_id));

  let started = 0;
  let failed = 0;
  let skipped = 0;
  let processedEligible = 0;

  for (const row of eligible) {
    if (processedEligible >= input.limit) {
      break;
    }

    const contact = contactById.get(row.contact_id);
    if (!contact) {
      continue;
    }

    const { data: completed } = await supabase
      .from("survey_sessions")
      .select("id")
      .eq("campaign_id", input.campaignId)
      .eq("contact_id", row.contact_id)
      .eq("status", "completed")
      .maybeSingle();

    if (completed) {
      skipped += 1;
      continue;
    }

    // Qualquer sessão em andamento (com ou sem resposta) = já enviou intro/perguntas.
    // Antes reiniciávamos sessões vazias a cada lote → 2x/3x a mesma pesquisa.
    const { data: inProgress } = await supabase
      .from("survey_sessions")
      .select("id")
      .eq("contact_id", row.contact_id)
      .eq("status", "in_progress")
      .maybeSingle();

    if (inProgress) {
      skipped += 1;
      continue;
    }

    processedEligible += 1;
    const phone = contact.phone_number?.replace(/\D/g, "") ?? "";
    if (!phone) {
      failed += 1;
      continue;
    }

    try {
      const outcome = await startSurveySession(supabase, {
        flow: input.flow,
        campaignId: input.campaignId,
        contactId: row.contact_id,
        phone,
        send: input.send,
      });
      if (outcome === "started") {
        started += 1;
      } else if (outcome === "already_active") {
        skipped += 1;
      } else {
        failed += 1;
      }
    } catch (error) {
      failed += 1;
      console.error("survey_open_window_start_failed", {
        contactId: row.contact_id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    started,
    failed,
    skipped,
    remaining: Math.max(eligible.length - started - skipped - failed, 0),
  };
}

const SURVEY_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export async function handleSurveyInbound(
  supabase: SupabaseClient,
  message: MetaWebhookMessage,
  contactId: string,
  phone: string,
  send: SurveySendContext,
): Promise<boolean> {
  const { data: session } = await supabase
    .from("survey_sessions")
    .select("id, flow_id, campaign_id, contact_id, current_step_index, status, started_at, updated_at")
    .eq("contact_id", contactId)
    .eq("status", "in_progress")
    .maybeSingle();

  if (!session) {
    return false;
  }

  const sessionAnchor = session.updated_at ?? session.started_at;
  const sessionAgeMs = sessionAnchor ? Date.now() - Date.parse(sessionAnchor) : Number.POSITIVE_INFINITY;
  if (!Number.isFinite(sessionAgeMs) || sessionAgeMs > SURVEY_SESSION_TTL_MS) {
    await abandonSession(supabase, session.id);
    console.info("survey_abandoned_expired", {
      contactId,
      sessionId: session.id,
      sessionAnchor,
    });
    return false;
  }

  const { data: flow } = await supabase
    .from("survey_flows")
    .select("id, slug, name, intro_message, steps")
    .eq("id", session.flow_id)
    .maybeSingle();

  if (!flow) {
    return false;
  }

  const steps = parseSurveySteps(flow.steps);
  const stepIndex = session.current_step_index;
  const currentStep = steps[stepIndex];

  if (!currentStep) {
    await completeSession(supabase, session.id);
    return true;
  }

  const responseValue = extractResponseValue(message);
  if (!responseValue?.trim()) {
    return false;
  }

  const trimmed = responseValue.trim();
  const displayLabel = extractResponseLabel(message)?.trim() ?? trimmed;

  if (currentStep.kind === "text") {
    if (trimmed.length < 1) {
      return false;
    }
    // Texto livre longo demais para uma pesquisa costuma ser pedido/atendimento.
    if (trimmed.length > 280 && !isInteractiveChoiceReply(message)) {
      await abandonSession(supabase, session.id);
      console.info("survey_abandoned_long_free_text", {
        contactId,
        sessionId: session.id,
      });
      return false;
    }
  } else {
    const matched = matchChoiceOption(currentStep, trimmed) ??
      matchChoiceOption(currentStep, displayLabel);

    if (!matched && currentStep.options?.length) {
      // Texto livre (ex.: pedido) não deve prender o cliente na pesquisa.
      if (!isInteractiveChoiceReply(message)) {
        await abandonSession(supabase, session.id);
        console.info("survey_abandoned_non_choice_reply", {
          contactId,
          sessionId: session.id,
          stepIndex,
        });
        return false;
      }

      await sendPlainMessage(supabase, {
        phone,
        contactId,
        body: "Não entendi essa opção. Toque em uma das opções da pergunta anterior ou digite de novo.",
        send,
        label: "survey_retry",
      });
      return true;
    }
  }

  const matchedOption = currentStep.kind === "choice"
    ? matchChoiceOption(currentStep, trimmed) ?? matchChoiceOption(currentStep, displayLabel)
    : null;
  const storedValue = matchedOption?.id ?? trimmed;
  const label = currentStep.kind === "choice"
    ? matchedOption?.label ?? stepLabel(currentStep, trimmed) ?? displayLabel
    : trimmed;

  const now = new Date().toISOString();
  const { error: answerError } = await supabase.from("survey_session_answers").insert({
    session_id: session.id,
    step_index: stepIndex,
    step_id: currentStep.id,
    response_value: storedValue,
    response_label: label,
    response_type: normalizeSurveyResponseType(message, currentStep.kind),
    meta_message_id: message.id,
    received_at: now,
  });

  if (answerError?.code === "23505") {
    return true;
  }

  if (answerError) {
    console.error("survey_answer_insert_failed", {
      message: answerError.message,
      code: answerError.code,
      details: answerError.details,
      responseType: normalizeSurveyResponseType(message, currentStep.kind),
    });
    return true;
  }

  await markCampaignRecipientEngaged(supabase, session.campaign_id, contactId);

  const nextIndex = stepIndex + 1;
  if (nextIndex >= steps.length) {
    await completeSession(supabase, session.id, flow.slug);
    await sendPlainMessage(supabase, {
      phone,
      contactId,
      body: "Obrigada por responder! 💚 Sua opinião ajuda muito a Dona Rosa a melhorar.",
      send,
      label: "survey_thanks",
    });
    return true;
  }

  const updatedSession = { ...session, current_step_index: nextIndex } as SurveySessionRow;

  try {
    await sendSurveyStep(supabase, {
      session: updatedSession,
      flow: flow as SurveyFlowRow,
      phone,
      send,
    });
  } catch (sendError) {
    console.error("survey_next_step_send_failed", {
      sessionId: session.id,
      nextIndex,
      message: sendError instanceof Error ? sendError.message : String(sendError),
    });
    return true;
  }

  await supabase
    .from("survey_sessions")
    .update({ current_step_index: nextIndex, updated_at: now })
    .eq("id", session.id);

  return true;
}

async function abandonSession(supabase: SupabaseClient, sessionId: string): Promise<void> {
  await supabase
    .from("survey_sessions")
    .update({
      status: "abandoned",
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);
}

/** Se o cliente respondeu a pesquisa, a mensagem ativa chegou — marca entregue. */
async function markCampaignRecipientEngaged(
  supabase: SupabaseClient,
  campaignId: string | null,
  contactId: string,
): Promise<void> {
  if (!campaignId) {
    return;
  }

  const { data: recipient } = await supabase
    .from("broadcast_campaign_recipients")
    .select("id, send_status")
    .eq("campaign_id", campaignId)
    .eq("contact_id", contactId)
    .maybeSingle();

  if (!recipient) {
    return;
  }

  if (recipient.send_status === "delivered" || recipient.send_status === "read") {
    return;
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("broadcast_campaign_recipients")
    .update({
      send_status: "delivered",
      delivered_at: now,
      failure_reason: null,
    })
    .eq("id", recipient.id);

  if (error) {
    console.error("mark_recipient_engaged_failed", error.message);
    return;
  }

  await supabase.rpc("increment_broadcast_campaign_delivered", {
    p_campaign_id: campaignId,
  });
}

async function completeSession(
  supabase: SupabaseClient,
  sessionId: string,
  flowSlug?: string,
): Promise<void> {
  const now = new Date().toISOString();
  await supabase
    .from("survey_sessions")
    .update({ status: "completed", completed_at: now, updated_at: now })
    .eq("id", sessionId);

  if (flowSlug === "pesquisa-delivery-2025") {
    await applyCompletionTag(supabase, sessionId, "pesquisa-delivery-respondeu");
  } else if (flowSlug === "pesquisa-reativacao-inativos") {
    await applyCompletionTag(supabase, sessionId, "pesquisa-reativacao-respondeu");
  }
}

async function applyCompletionTag(
  supabase: SupabaseClient,
  sessionId: string,
  tagSlug: string,
): Promise<void> {
  const { data: session } = await supabase
    .from("survey_sessions")
    .select("contact_id")
    .eq("id", sessionId)
    .maybeSingle();

  const { data: tag } = await supabase
    .from("whatsapp_tags")
    .select("id")
    .eq("slug", tagSlug)
    .maybeSingle();

  if (!session?.contact_id || !tag?.id) {
    return;
  }

  await supabase.from("whatsapp_contact_tags").upsert(
    {
      contact_id: session.contact_id,
      tag_id: tag.id,
      assigned_by: "system",
    },
    { onConflict: "contact_id,tag_id", ignoreDuplicates: true },
  );
}

async function sendSurveyStep(
  supabase: SupabaseClient,
  input: {
    session: SurveySessionRow;
    flow: SurveyFlowRow;
    phone: string;
    send: SurveySendContext;
  },
): Promise<void> {
  const steps = parseSurveySteps(input.flow.steps);
  const step = steps[input.session.current_step_index];
  if (!step) {
    return;
  }

  const body = formatQuestionBody(step, input.session.current_step_index + 1, steps.length);

  if (step.kind === "text") {
    await sendPlainMessage(supabase, {
      phone: input.phone,
      contactId: input.session.contact_id,
      body: `${body}\n\n_Digite sua resposta em uma mensagem._`,
      send: input.send,
      label: `survey_step_${step.id}`,
    });
    return;
  }

  const options = step.options ?? [];
  if (options.length <= 3) {
    const messageId = await sendInteractiveButtons(input.phone, body, options, input.send);
    await persistOutboundCrmMessage(supabase, {
      waId: input.phone,
      metaMessageId: messageId,
      messageType: "interactive",
      bodyText: body,
      content: { survey_step_id: step.id, options },
      whatsappContactId: input.session.contact_id,
    });
    return;
  }

  const messageId = await sendInteractiveList(input.phone, body, options, input.send);
  await persistOutboundCrmMessage(supabase, {
    waId: input.phone,
    metaMessageId: messageId,
    messageType: "interactive",
    bodyText: body,
    content: { survey_step_id: step.id, options },
    whatsappContactId: input.session.contact_id,
    isAutomated: true,
  });
}

async function sendPlainMessage(
  supabase: SupabaseClient,
  input: {
    phone: string;
    contactId: string;
    body: string;
    send: SurveySendContext;
    label: string;
  },
): Promise<void> {
  const messageId = input.send.isDryRun
    ? `dry_run_survey_${crypto.randomUUID()}`
    : (await sendWhatsAppText(input.send.accessToken, input.send.phoneNumberId, {
      to: input.phone,
      body: input.body,
    })).messageId;

  await persistOutboundCrmMessage(supabase, {
    waId: input.phone,
    metaMessageId: messageId,
    messageType: "text",
    bodyText: input.body,
    content: { survey_part: input.label },
    whatsappContactId: input.contactId,
    isAutomated: true,
  });
}

async function sendInteractiveButtons(
  phone: string,
  body: string,
  options: Array<{ id: string; label: string }>,
  send: SurveySendContext,
): Promise<string> {
  if (send.isDryRun) {
    return `dry_run_survey_${crypto.randomUUID()}`;
  }
  const result = await sendWhatsAppInteractiveButtons(send.accessToken, send.phoneNumberId, {
    to: phone,
    body,
    buttons: options.map((o) => ({ id: o.id, title: o.label })),
  });
  return result.messageId;
}

async function sendInteractiveList(
  phone: string,
  body: string,
  options: Array<{ id: string; label: string }>,
  send: SurveySendContext,
): Promise<string> {
  if (send.isDryRun) {
    return `dry_run_survey_${crypto.randomUUID()}`;
  }
  const result = await sendWhatsAppInteractiveList(send.accessToken, send.phoneNumberId, {
    to: phone,
    body,
    buttonLabel: "Ver opções",
    rows: options.map((o) => ({ id: o.id, title: o.label })),
  });
  return result.messageId;
}
