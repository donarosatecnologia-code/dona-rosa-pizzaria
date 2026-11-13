/** Espelha as regras do webhook/orquestrador — testáveis sem Deno. */

export const SURVEY_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export function shouldStartSurveyAfterInbound(input: {
  contextMessageId?: string | null;
  repliedCampaignHasSurveyFlow: boolean;
  hasCompletedSession: boolean;
  hasInProgressSession: boolean;
}): boolean {
  if (!input.contextMessageId?.trim()) {
    return false;
  }
  if (!input.repliedCampaignHasSurveyFlow) {
    return false;
  }
  if (input.hasCompletedSession || input.hasInProgressSession) {
    return false;
  }
  return true;
}

export function shouldRestartSurveySession(input: {
  hasInProgressForCampaign: boolean;
  hasInProgressAny: boolean;
}): "already_active" | "start" {
  if (input.hasInProgressForCampaign || input.hasInProgressAny) {
    return "already_active";
  }
  return "start";
}

export type SurveyInboundDecision = "consume" | "abandon_and_leave_to_inbox" | "ignore";

export function decideSurveyInbound(input: {
  hasInProgressSession: boolean;
  sessionUpdatedAt?: string | null;
  stepKind: "choice" | "text";
  isInteractiveChoice: boolean;
  bodyText: string;
  nowMs?: number;
}): SurveyInboundDecision {
  if (!input.hasInProgressSession) {
    return "ignore";
  }

  const nowMs = input.nowMs ?? Date.now();
  const sessionTs = input.sessionUpdatedAt ? Date.parse(input.sessionUpdatedAt) : Number.NaN;
  if (!Number.isFinite(sessionTs) || nowMs - sessionTs > SURVEY_SESSION_TTL_MS) {
    return "abandon_and_leave_to_inbox";
  }

  const trimmed = input.bodyText.trim();
  if (!trimmed) {
    return "ignore";
  }

  if (input.stepKind === "text") {
    if (trimmed.length > 280 && !input.isInteractiveChoice) {
      return "abandon_and_leave_to_inbox";
    }
    return "consume";
  }

  if (!input.isInteractiveChoice) {
    return "abandon_and_leave_to_inbox";
  }

  return "consume";
}
