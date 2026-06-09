import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SurveyFlow, SurveySessionWithAnswers, SurveyStep } from "@/integrations/supabase/types/survey-flows";
import { normalizeSurveySteps, toSurveySlug } from "@/lib/whatsapp/survey-flow-utils";

const FLOWS_KEY = ["whatsapp", "survey-flows"] as const;

export interface SurveyFlowInput {
  name: string;
  description?: string;
  intro_message: string;
  steps: SurveyStep[];
  suggested_queue_slug?: string | null;
}

export function useSurveyFlows() {
  return useQuery({
    queryKey: FLOWS_KEY,
    queryFn: async (): Promise<SurveyFlow[]> => {
      const { data, error } = await supabase
        .from("survey_flows")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []) as SurveyFlow[];
    },
  });
}

export function useCreateSurveyFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SurveyFlowInput) => {
      const steps = normalizeSurveySteps(input.steps);
      const baseSlug = toSurveySlug(input.name);
      const slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;

      const { data, error } = await supabase
        .from("survey_flows")
        .insert({
          slug,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          intro_message: input.intro_message.trim(),
          steps,
          suggested_queue_slug: input.suggested_queue_slug ?? null,
          is_active: true,
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data as SurveyFlow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLOWS_KEY });
    },
  });
}

export function useUpdateSurveyFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string } & SurveyFlowInput) => {
      const steps = normalizeSurveySteps(input.steps);

      const { data, error } = await supabase
        .from("survey_flows")
        .update({
          name: input.name.trim(),
          description: input.description?.trim() || null,
          intro_message: input.intro_message.trim(),
          steps,
          suggested_queue_slug: input.suggested_queue_slug ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data as SurveyFlow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLOWS_KEY });
    },
  });
}

export function useDeleteSurveyFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (flowId: string) => {
      const { error } = await supabase
        .from("survey_flows")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", flowId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLOWS_KEY });
    },
  });
}

export function useSurveyCampaignResults(campaignId: string | undefined) {
  return useQuery({
    queryKey: ["whatsapp", "survey-results", campaignId],
    enabled: Boolean(campaignId),
    queryFn: async (): Promise<SurveySessionWithAnswers[]> => {
      const { data: sessions, error: sessionsError } = await supabase
        .from("survey_sessions")
        .select("id, contact_id, status, completed_at")
        .eq("campaign_id", campaignId!);

      if (sessionsError) {
        throw sessionsError;
      }

      if (!sessions?.length) {
        return [];
      }

      const sessionIds = sessions.map((s) => s.id);
      const { data: answers, error: answersError } = await supabase
        .from("survey_session_answers")
        .select("*")
        .in("session_id", sessionIds)
        .order("step_index", { ascending: true });

      if (answersError) {
        throw answersError;
      }

      const answersBySession = new Map<string, typeof answers>();
      for (const answer of answers ?? []) {
        const list = answersBySession.get(answer.session_id) ?? [];
        list.push(answer);
        answersBySession.set(answer.session_id, list);
      }

      return sessions.map((session) => ({
        id: session.id,
        contact_id: session.contact_id,
        status: session.status,
        completed_at: session.completed_at,
        answers: answersBySession.get(session.id) ?? [],
      }));
    },
  });
}
