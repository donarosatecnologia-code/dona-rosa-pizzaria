const ERROR_MAP: Record<string, string> = {
  service_window_closed: "Passou de 24h. Envie uma mensagem pronta.",
  whatsapp_not_registered:
    "O número ainda não está na API do WhatsApp. Conclua a conexão em Ajustes → Conectar WhatsApp.",
  meta_api_error: "WhatsApp fora do ar agora. Tente em alguns minutos.",
  meta_template_permission_denied:
    "A Meta ainda não liberou envio de modelos. Aguarde o App Review e a conexão do WhatsApp no painel.",
  template_not_submittable: "Só é possível enviar rascunhos ou modelos reprovados pela Meta.",
  missing_meta_env: "WhatsApp não configurado. Peça ajuda para reconectar.",
  conversation_not_found: "Conversa não encontrada.",
  template_not_found_or_not_approved: "Mensagem pronta não disponível.",
  method_not_allowed: "Algo deu errado. Tente de novo.",
  internal_error: "Algo deu errado. Tente de novo.",
  unauthorized: "Sua sessão acabou. Entre de novo.",
  missing_auth: "Sua sessão acabou. Entre de novo.",
  invalid_auth: "Sua sessão acabou. Entre de novo.",
  not_admin: "Sem permissão de admin para disparar.",
  campaign_id_required: "Campanha inválida. Atualize a página e tente de novo.",
  campaign_not_found: "Campanha não encontrada.",
  campaign_not_published: "Publique a campanha antes de disparar.",
  template_name_missing: "A campanha está sem modelo de mensagem. Edite e publique de novo.",
  target_missing: "A campanha não tem destinatário (contato ou segmento).",
  queue_id_missing:
    "Esta versão do disparo ainda exige um segmento. Atualize a function broadcast-send ou selecione um segmento.",
  campaign_already_completed: "Esta campanha já foi concluída.",
  broadcast_send_failed: "Disparo falhou. Veja o relatório da campanha.",
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

  if (
    trimmed.includes("App Review") ||
    trimmed.includes("coexistência") ||
    trimmed.includes("permissão para criar") ||
    trimmed.includes("permissão para gerenciar modelos")
  ) {
    return trimmed;
  }

  if (trimmed.includes("Meta") || trimmed.includes("webhook") || trimmed.includes("API")) {
    return "WhatsApp fora do ar agora. Tente em alguns minutos.";
  }

  if (trimmed.length > 200) {
    return "Algo deu errado. Tente de novo.";
  }

  return trimmed;
}
