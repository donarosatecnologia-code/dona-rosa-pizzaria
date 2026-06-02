/** Extrai mensagem legível de erros do supabase.functions.invoke. */
export async function readFunctionInvokeError(
  error: unknown,
  data: unknown,
): Promise<string> {
  const payload = data as { error?: string; message?: string } | null;

  if (payload?.message) {
    return payload.message;
  }

  if (payload?.error === "template_not_submittable") {
    return "Este modelo já foi enviado. Aguarde a aprovação ou edite um rascunho/reprovado.";
  }

  if (payload?.error === "template_id_required") {
    return "Modelo não identificado.";
  }

  if (payload?.error === "missing_meta_env") {
    return "Configuração Meta incompleta no servidor.";
  }

  if (error && typeof error === "object" && "context" in error) {
    const response = (error as { context?: Response }).context;
    if (response) {
      try {
        const body = (await response.json()) as { message?: string; error?: string };
        if (body.message) {
          return body.message;
        }
        if (body.error === "template_not_submittable") {
          return "Este modelo já foi enviado. Aguarde a aprovação ou edite um rascunho/reprovado.";
        }
      } catch {
        /* ignore parse errors */
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Não foi possível completar a operação.";
}
