import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { readFunctionInvokeError } from "@/lib/readFunctionInvokeError";
import type {
  TemplateSubmitResult,
  TemplateSyncResult,
  WhatsappTemplate,
  WhatsappTemplateCategory,
  WhatsappTemplateVariable,
} from "@/integrations/supabase/types/whatsapp-templates";
import { extractVariablesFromBody, toTemplateName } from "@/integrations/supabase/types/whatsapp-templates";

const TEMPLATES_KEY = ["whatsapp", "templates"] as const;

export function useWhatsappTemplates() {
  return useQuery({
    queryKey: TEMPLATES_KEY,
    queryFn: async (): Promise<WhatsappTemplate[]> => {
      const { data, error } = await supabase
        .from("whatsapp_templates")
        .select("*")
        .is("archived_at", null)
        .order("updated_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []) as WhatsappTemplate[];
    },
  });
}

export function useApprovedWhatsappTemplates() {
  return useQuery({
    queryKey: [...TEMPLATES_KEY, "approved"],
    queryFn: async (): Promise<WhatsappTemplate[]> => {
      const { data, error } = await supabase
        .from("whatsapp_templates")
        .select("*")
        .eq("status", "approved")
        .is("archived_at", null)
        .order("display_name");

      if (error) {
        throw error;
      }

      return (data ?? []) as WhatsappTemplate[];
    },
  });
}

export function useCreateWhatsappTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      display_name: string;
      category: WhatsappTemplateCategory;
      body: string;
      variables: WhatsappTemplateVariable[];
      language?: string;
    }) => {
      const name = toTemplateName(input.display_name);
      const variables = input.variables.length > 0
        ? input.variables
        : extractVariablesFromBody(input.body);

      const { data, error } = await supabase
        .from("whatsapp_templates")
        .insert({
          name,
          display_name: input.display_name.trim(),
          category: input.category,
          language: input.language ?? "pt_BR",
          body: input.body.trim(),
          variables,
          status: "draft",
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data as WhatsappTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
  });
}

export function useUpdateWhatsappTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      display_name?: string;
      category?: WhatsappTemplateCategory;
      body?: string;
      variables?: WhatsappTemplateVariable[];
    }) => {
      const patch: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (input.display_name) {
        patch.display_name = input.display_name.trim();
        patch.name = toTemplateName(input.display_name);
      }
      if (input.category) {
        patch.category = input.category;
      }
      if (input.body !== undefined) {
        patch.body = input.body.trim();
        patch.variables = input.variables ?? extractVariablesFromBody(input.body);
        patch.status = "draft";
        patch.rejection_reason = null;
      }

      const { data, error } = await supabase
        .from("whatsapp_templates")
        .update(patch)
        .eq("id", input.id)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data as WhatsappTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
  });
}

export function useSubmitWhatsappTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { data, error } = await supabase.functions.invoke<TemplateSubmitResult>(
        "whatsapp-templates",
        { body: { action: "submit", template_id: templateId } },
      );

      if (error || !data?.ok) {
        throw new Error(await readFunctionInvokeError(error, data));
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
  });
}

export function useSyncWhatsappTemplates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId?: string) => {
      const { data, error } = await supabase.functions.invoke<TemplateSyncResult>(
        "whatsapp-templates",
        { body: { action: "sync", template_id: templateId } },
      );

      if (error || !data?.ok) {
        throw new Error(await readFunctionInvokeError(error, data));
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
  });
}
