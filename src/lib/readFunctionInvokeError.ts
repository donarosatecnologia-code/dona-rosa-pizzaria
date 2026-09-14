import { toAdminUserMessage } from "@/lib/adminUserMessage";

/** Extrai mensagem legível de erros do supabase.functions.invoke. */
export async function readFunctionInvokeError(
  error: unknown,
  data: unknown,
): Promise<string> {
  const payload = data as { error?: string; message?: string } | null;

  if (payload?.message) {
    return toAdminUserMessage(payload.message);
  }

  if (payload?.error) {
    return toAdminUserMessage(payload.error);
  }

  if (error && typeof error === "object" && "context" in error) {
    const response = (error as { context?: Response }).context;
    if (response) {
      try {
        const clone = response.clone();
        const body = (await clone.json()) as { message?: string; error?: string };
        if (body.message) {
          return toAdminUserMessage(body.message);
        }
        if (body.error) {
          return toAdminUserMessage(body.error);
        }
      } catch {
        try {
          const body = (await response.json()) as { message?: string; error?: string };
          if (body.message) {
            return toAdminUserMessage(body.message);
          }
          if (body.error) {
            return toAdminUserMessage(body.error);
          }
        } catch {
          /* ignore parse errors */
        }
      }
    }
  }

  if (error instanceof Error && error.message) {
    // FunctionsHttpError message is often just "Edge Function returned a non-2xx status code"
    if (!error.message.includes("non-2xx")) {
      return toAdminUserMessage(error.message);
    }
  }

  return "Algo deu errado. Tente de novo.";
}
