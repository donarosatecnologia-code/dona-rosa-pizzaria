import type { SupabaseClient } from "npm:@supabase/supabase-js@2.100.0";
import {
  sendWhatsAppInteractiveButtons,
  sendWhatsAppInteractiveList,
  sendWhatsAppText,
} from "./meta-graph-api.ts";
import type { MetaWebhookMessage } from "./meta-webhook.ts";
import { extractResponseValue, resolveResponseType } from "./meta-webhook.ts";
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

function stepLabel(step: SurveyStep, optionId: string): string | null {
  const match = step.options?.find((o) => o.id === optionId);
  return match?.label ?? null;
}

function formatQuestionBody(step: SurveyStep, stepNumber: number, total: number): string {
  return `*Pergunta ${stepNumber} de ${total}*\n\n${step.question}`;
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
): Promise<void> {
  const steps = parseSurveySteps(input.flow.steps);
  if (steps.length === 0) {
    return;
  }

  const { data: existing } = await supabase
    .from("survey_sessions")
    .select("id")
    .eq("contact_id", input.contactId)
    .eq("status", "in_progress")
    .maybeSingle();

  if (existing) {
    await supabase
      .from("survey_sessions")
      .update({ status: "abandoned", updated_at: new Date().toISOString() })
      .eq("id", existing.id);
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
    console.error("survey_session_start_failed", error?.message);
    return;
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
}

export async function handleSurveyInbound(
  supabase: SupabaseClient,
  message: MetaWebhookMessage,
  contactId: string,
  phone: string,
  send: SurveySendContext,
): Promise<boolean> {
  const { data: session } = await supabase
    .from("survey_sessions")
    .select("id, flow_id, campaign_id, contact_id, current_step_index, status")
    .eq("contact_id", contactId)
    .eq("status", "in_progress")
    .maybeSingle();

  if (!session) {
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
    return true;
  }

  const responseType = resolveResponseType(message);
  const trimmed = responseValue.trim();

  if (currentStep.kind === "text") {
    if (trimmed.length < 1) {
      return true;
    }
  } else {
    const matched = currentStep.options?.find(
      (o) => o.id === trimmed || o.label.toLowerCase() === trimmed.toLowerCase(),
    );
    if (!matched && currentStep.options?.length) {
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

  const label = currentStep.kind === "choice"
    ? stepLabel(currentStep, trimmed) ?? trimmed
    : trimmed;

  const now = new Date().toISOString();
  const { error: answerError } = await supabase.from("survey_session_answers").insert({
    session_id: session.id,
    step_index: stepIndex,
    step_id: currentStep.id,
    response_value: trimmed,
    response_label: label,
    response_type: currentStep.kind === "text" ? "text" : responseType,
    meta_message_id: message.id,
    received_at: now,
  });

  if (answerError?.code === "23505") {
    return true;
  }

  if (answerError) {
    console.error("survey_answer_insert_failed", answerError.message);
    return true;
  }

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

  await supabase
    .from("survey_sessions")
    .update({ current_step_index: nextIndex, updated_at: now })
    .eq("id", session.id);

  const updatedSession = { ...session, current_step_index: nextIndex } as SurveySessionRow;
  await sendSurveyStep(supabase, {
    session: updatedSession,
    flow: flow as SurveyFlowRow,
    phone,
    send,
  });

  return true;
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
