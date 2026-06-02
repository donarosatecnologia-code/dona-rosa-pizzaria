const ERROR_MAP: Record<string, string> = {
  service_window_closed: "Passou de 24h. Envie uma mensagem pronta.",
  meta_api_error: "WhatsApp fora do ar agora. Tente em alguns minutos.",
  missing_meta_env: "WhatsApp não configurado. Peça ajuda para reconectar.",
  conversation_not_found: "Conversa não encontrada.",
  template_not_found_or_not_approved: "Mensagem pronta não disponível.",
  method_not_allowed: "Algo deu errado. Tente de novo.",
  internal_error: "Algo deu errado. Tente de novo.",
  unauthorized: "Sua sessão acabou. Entre de novo.",
};

/** Traduz códigos técnicos para copy amigável da Rosa. */
export function toAdminUserMessage(input: string | undefined | null): string {
  if (!input?.trim()) {
    return "Algo deu errado. Tente de novo.";
  }

  const trimmed = input.trim();

  if (ERROR_MAP[trimmed]) {
    return ERROR_MAP[trimmed];
  }

  if (trimmed.includes("schema") || trimmed.includes("Supabase") || trimmed.includes("PGRST")) {
    return "Não deu para salvar. Tente de novo.";
  }

  if (trimmed.includes("Meta") || trimmed.includes("webhook") || trimmed.includes("API")) {
    return "WhatsApp fora do ar agora. Tente em alguns minutos.";
  }

  if (trimmed.length > 120) {
    return "Algo deu errado. Tente de novo.";
  }

  return trimmed;
}
