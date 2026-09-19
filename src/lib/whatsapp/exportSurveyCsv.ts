import type { SurveyStep } from "@/integrations/supabase/types/survey-flows";

/** Separador para Excel em português (Brasil) abrir colunas corretamente. */
const CSV_SEPARATOR = ";";

function escapeCsvCell(value: string): string {
  const normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (
    normalized.includes('"') ||
    normalized.includes(CSV_SEPARATOR) ||
    normalized.includes("\n")
  ) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function joinCsvRow(cells: string[]): string {
  return cells.map((cell) => escapeCsvCell(cell)).join(CSV_SEPARATOR);
}

/** Linha no mesmo formato da tabela do relatório de disparo. */
export interface CampaignReportExportRow {
  name: string;
  phone: string;
  /** Só dígitos — útil para colar no WhatsApp / planilha de contato. */
  phoneDigits: string;
  /** delivered / sent / failed / read (status Meta ou ajustado). */
  sendStatus: string;
  /** Receberam o template | Só aceito (sem entrega) | Falhou | Não enviado */
  deliveryLabel: string;
  /** Em andamento | Prontos p/ perguntas | Pedir oi | Pesquisa ok | — */
  surveyStageLabel: string;
  /** Sim | Não — janela Meta 24h aberta. */
  openWindowLabel: string;
  failureReason: string;
  sentAt: string;
  lastInboundAt: string;
  /** Respostas por pergunta (pesquisa), na ordem dos steps. */
  stepAnswers?: string[];
}

export function buildCampaignReportCsv(
  campaignLabel: string,
  filterLabel: string,
  rows: CampaignReportExportRow[],
  steps: SurveyStep[] = [],
): string {
  const stepHeaders = steps.map((step, index) => {
    return `${index + 1}. ${step.question}`.slice(0, 80);
  });

  const header = [
    "campanha",
    "filtro_exportado",
    "nome",
    "telefone",
    "telefone_digitos",
    "status_envio_meta",
    "entrega_template",
    "etapa_pesquisa",
    "janela_24h",
    "ultimo_contato_cliente",
    "motivo_da_falha",
    "enviado_em",
    ...stepHeaders,
  ];

  const csvRows = rows.map((row) => {
    const stepCells = steps.map((_, index) => row.stepAnswers?.[index] ?? "");
    return joinCsvRow([
      campaignLabel,
      filterLabel,
      row.name,
      row.phone,
      row.phoneDigits,
      row.sendStatus,
      row.deliveryLabel,
      row.surveyStageLabel,
      row.openWindowLabel,
      row.lastInboundAt,
      row.failureReason,
      row.sentAt,
      ...stepCells,
    ]);
  });

  // `sep=;` faz o Excel BR reconhecer o delimitador ao abrir o arquivo.
  return [`sep=${CSV_SEPARATOR}`, joinCsvRow(header), ...csvRows].join("\r\n");
}

export { downloadCsvFile } from "./exportBroadcastCsv";
