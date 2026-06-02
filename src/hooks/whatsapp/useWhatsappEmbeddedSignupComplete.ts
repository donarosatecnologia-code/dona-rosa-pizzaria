import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { readFunctionInvokeError } from "@/lib/readFunctionInvokeError";
import type { EmbeddedSignupCompletePayload } from "@/lib/meta-embedded-signup";

interface EmbeddedSignupResult {
  ok: boolean;
  waba_id?: string;
  phone_number_id?: string;
  message?: string;
  error?: string;
}

export function useWhatsappEmbeddedSignupComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: EmbeddedSignupCompletePayload) => {
      const { data, error } = await supabase.functions.invoke<EmbeddedSignupResult>(
        "whatsapp-embedded-signup",
        { body: payload },
      );

      if (error || !data?.ok) {
        throw new Error(await readFunctionInvokeError(error, data));
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "connection-status"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "crm"] });
    },
  });
}
