import type { BroadcastResponse } from "@/integrations/supabase/types/whatsapp-broadcast";
import type { WhatsappContact } from "@/integrations/supabase/types/whatsapp-broadcast";

export function buildBroadcastResponsesCsv(
  responses: BroadcastResponse[],
  contactById: Map<string, WhatsappContact>,
  campaignLabel: string,
): string {
  const separator = ";";
  function escapeCell(value: string): string {
    if (value.includes('"') || value.includes(separator) || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
  function joinRow(cells: string[]): string {
    return cells.map((cell) => escapeCell(String(cell))).join(separator);
  }

  const header = ["campanha", "telefone", "nome", "resposta", "tipo", "recebido_em"];
  const rows = responses.map((response) => {
    const contact = contactById.get(response.contact_id);
    return joinRow([
      campaignLabel,
      contact?.phone_number ?? "",
      contact?.name ?? "",
      response.response_value,
      response.response_type,
      new Date(response.received_at).toLocaleString("pt-BR").replace(",", ""),
    ]);
  });

  return [`sep=${separator}`, joinRow(header), ...rows].join("\r\n");
}

export function downloadCsvFile(filename: string, content: string): void {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
