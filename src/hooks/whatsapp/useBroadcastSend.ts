import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BroadcastSendResult {
  ok: boolean;
  campaign_id: string;
  dry_run?: boolean;
  sent: number;
  failed: number;
  pending_remaining: number;
  status: string;
  error?: string;
}

export interface BroadcastSendProgress {
  batch: number;
  sentTotal: number;
  failedTotal: number;
  pendingRemaining: number;
  status: string;
  dryRun: boolean;
}

const MAX_BATCHES = 200;

async function invokeBroadcastBatch(campaignId: string): Promise<BroadcastSendResult> {
  const { data, error } = await supabase.functions.invoke<BroadcastSendResult>("broadcast-send", {
    body: { campaign_id: campaignId },
  });

  if (error) {
    throw error;
  }

  if (!data?.ok) {
    throw new Error(data?.error ?? "broadcast_send_failed");
  }

  return data;
}

/** Envia lotes sucessivos até não restar pendente (ou atingir limite de segurança). */
export async function sendBroadcastCampaignFully(
  campaignId: string,
  onProgress?: (progress: BroadcastSendProgress) => void,
): Promise<BroadcastSendResult & { batches: number }> {
  let sentTotal = 0;
  let failedTotal = 0;
  let pendingRemaining = 0;
  let status = "sending";
  let dryRun = false;
  let batches = 0;
  let lastResult: BroadcastSendResult | null = null;

  for (let batch = 1; batch <= MAX_BATCHES; batch += 1) {
    const result = await invokeBroadcastBatch(campaignId);
    lastResult = result;
    batches = batch;
    sentTotal += result.sent;
    failedTotal += result.failed;
    pendingRemaining = result.pending_remaining;
    status = result.status;
    dryRun = Boolean(result.dry_run);

    onProgress?.({
      batch,
      sentTotal,
      failedTotal,
      pendingRemaining,
      status,
      dryRun,
    });

    if (pendingRemaining <= 0 || status === "completed") {
      break;
    }

    // Lote sem progresso — evita loop infinito (ex.: todos falhando e voltando a pending)
    if (result.sent === 0 && result.failed === 0) {
      break;
    }
  }

  if (!lastResult) {
    throw new Error("broadcast_send_failed");
  }

  return {
    ...lastResult,
    sent: sentTotal,
    failed: failedTotal,
    pending_remaining: pendingRemaining,
    status,
    dry_run: dryRun,
    batches,
  };
}

export function useBroadcastSend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      campaign_id: string;
      onProgress?: (progress: BroadcastSendProgress) => void;
    }) => {
      return sendBroadcastCampaignFully(input.campaign_id, input.onProgress);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "campaigns"] });
      queryClient.invalidateQueries({
        queryKey: ["whatsapp", "campaign-recipients", variables.campaign_id],
      });
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "contacts"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "crm"] });
    },
  });
}
