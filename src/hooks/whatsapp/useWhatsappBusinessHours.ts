import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { WhatsappBusinessHoursDay } from "@/integrations/supabase/types/whatsapp-inbox";

const HOURS_KEY = ["whatsapp", "business-hours"] as const;

export function useWhatsappBusinessHours() {
  return useQuery({
    queryKey: HOURS_KEY,
    queryFn: async (): Promise<WhatsappBusinessHoursDay[]> => {
      const { data, error } = await supabase
        .from("whatsapp_business_hours")
        .select("*")
        .order("day_of_week");

      if (error) {
        throw error;
      }

      return (data ?? []) as WhatsappBusinessHoursDay[];
    },
  });
}

export function useUpdateWhatsappBusinessHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      day_of_week: number;
      is_open: boolean;
      open_time: string | null;
      close_time: string | null;
    }) => {
      const { error } = await supabase
        .from("whatsapp_business_hours")
        .update({
          is_open: input.is_open,
          open_time: input.open_time,
          close_time: input.close_time,
          updated_at: new Date().toISOString(),
        })
        .eq("day_of_week", input.day_of_week);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOURS_KEY });
    },
  });
}

export function useDeleteWhatsappContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { contactId: string; reason?: string }) => {
      const { data, error } = await supabase.rpc("delete_whatsapp_contact_with_audit", {
        p_contact_id: input.contactId,
        p_reason: input.reason ?? null,
      });

      if (error) {
        throw error;
      }

      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "contacts"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "crm"] });
    },
  });
}

export function useContactDeletionAudit() {
  return useQuery({
    queryKey: ["whatsapp", "contact-deletion-audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_contact_deletion_audit")
        .select("*")
        .order("deleted_at", { ascending: false })
        .limit(500);

      if (error) {
        throw error;
      }

      return data ?? [];
    },
  });
}
