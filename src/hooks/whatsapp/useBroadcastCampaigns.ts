import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  BroadcastCampaign,
  BroadcastCampaignRecipient,
  BroadcastResponse,
} from "@/integrations/supabase/types/whatsapp-broadcast";

const CAMPAIGNS_KEY = ["whatsapp", "campaigns"] as const;

export function useBroadcastCampaigns() {
  return useQuery({
    queryKey: CAMPAIGNS_KEY,
    queryFn: async (): Promise<BroadcastCampaign[]> => {
      const { data, error } = await supabase
        .from("broadcast_campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []) as BroadcastCampaign[];
    },
  });
}

export function useBroadcastCampaignRecipients(campaignId: string | undefined) {
  return useQuery({
    queryKey: ["whatsapp", "campaign-recipients", campaignId],
    enabled: !!campaignId,
    queryFn: async (): Promise<BroadcastCampaignRecipient[]> => {
      const { data, error } = await supabase
        .from("broadcast_campaign_recipients")
        .select("*")
        .eq("campaign_id", campaignId!)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []) as BroadcastCampaignRecipient[];
    },
  });
}

export function useBroadcastResponses(campaignId?: string) {
  return useQuery({
    queryKey: ["whatsapp", "responses", campaignId ?? "all"],
    queryFn: async (): Promise<BroadcastResponse[]> => {
      let query = supabase
        .from("broadcast_responses")
        .select("*")
        .order("received_at", { ascending: false });

      if (campaignId) {
        query = query.eq("campaign_id", campaignId);
      }

      const { data, error } = await query;
      if (error) {
        throw error;
      }

      return (data ?? []) as BroadcastResponse[];
    },
  });
}

export function usePublishBroadcastCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase.rpc("publish_broadcast_campaign", {
        p_campaign_id: campaignId,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_KEY });
    },
  });
}

export function useCreateBroadcastCampaignDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      template_name_draft: string;
      template_params_draft?: Record<string, unknown>;
      content_type_draft?: string;
      queue_id_draft?: string;
      survey_flow_id_draft?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("broadcast_campaigns")
        .insert({
          template_name_draft: input.template_name_draft,
          template_params_draft: input.template_params_draft ?? { language: "en_US" },
          content_type_draft: input.content_type_draft ?? "informational",
          queue_id_draft: input.queue_id_draft ?? null,
          survey_flow_id_draft: input.survey_flow_id_draft ?? null,
          status: "draft",
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data as BroadcastCampaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_KEY });
    },
  });
}
