import type { SurveySessionWithAnswers } from "@/integrations/supabase/types/survey-flows";
import type { SurveyStep } from "@/integrations/supabase/types/survey-flows";
import type { WhatsappContact } from "@/integrations/supabase/types/whatsapp-broadcast";

function escapeCsvCell(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildSurveyResultsCsv(
  sessions: SurveySessionWithAnswers[],
  contactById: Map<string, WhatsappContact>,
  campaignLabel: string,
  steps: SurveyStep[],
): string {
  const stepHeaders = steps.map((s, i) => `p${i + 1}_${s.id}`);
  const header = ["campanha", "telefone", "nome", "status", "concluido_em", ...stepHeaders];

  const rows = sessions.map((session) => {
    const contact = contactById.get(session.contact_id);
    const answerByStep = new Map(session.answers.map((a) => [a.step_index, a]));

    const stepCells = steps.map((_, index) => {
      const answer = answerByStep.get(index);
      return answer?.response_label ?? answer?.response_value ?? "";
    });

    return [
      campaignLabel,
      contact?.phone_number ?? "",
      contact?.name ?? "",
      session.status,
      session.completed_at ? new Date(session.completed_at).toISOString() : "",
      ...stepCells,
    ]
      .map((cell) => escapeCsvCell(String(cell)))
      .join(",");
  });

  return [header.join(","), ...rows].join("\n");
}

export { downloadCsvFile } from "./exportBroadcastCsv";
