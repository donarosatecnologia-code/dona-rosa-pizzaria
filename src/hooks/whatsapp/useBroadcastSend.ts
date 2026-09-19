import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { readFunctionInvokeError } from "@/lib/readFunctionInvokeError";

export interface BroadcastSendResult {
  ok: boolean;
  campaign_id: string;
  dry_run?: boolean;
  mode?: string;
  sent: number;
  failed: number;
  skipped?: number;
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

async function invokeBroadcastBatch(
  campaignId: string,
  mode: "template" | "start_surveys" = "template",
  contactIds?: string[],
): Promise<BroadcastSendResult> {
  const body: {
    campaign_id: string;
    limit: number;
    mode: "template" | "start_surveys";
    contact_ids?: string[];
  } = {
    campaign_id: campaignId,
    limit: mode === "start_surveys" ? 10 : 10,
    mode,
  };

  if (contactIds && contactIds.length > 0) {
    body.contact_ids = contactIds;
    body.limit = Math.min(Math.max(contactIds.length, 1), 50);
  }

  const { data, error } = await supabase.functions.invoke<BroadcastSendResult>("broadcast-send", {
    body,
  });

  if (error || !data?.ok) {
    throw new Error(await readFunctionInvokeError(error, data));
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
    const result = await invokeBroadcastBatch(campaignId, "template");
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

/** Envia intro + perguntas para quem já respondeu o template (janela Meta 24h). */
export async function startSurveysForOpenWindowFully(
  campaignId: string,
  onProgress?: (progress: BroadcastSendProgress) => void,
  contactIds?: string[],
): Promise<BroadcastSendResult & { batches: number }> {
  let sentTotal = 0;
  let failedTotal = 0;
  let skippedTotal = 0;
  let pendingRemaining = 0;
  let status = "sending";
  let dryRun = false;
  let batches = 0;
  let lastResult: BroadcastSendResult | null = null;

  // Quando há seleção explícita, envia em um único pedido (até 50).
  const maxBatches = contactIds && contactIds.length > 0 ? 1 : MAX_BATCHES;

  for (let batch = 1; batch <= maxBatches; batch += 1) {
    const result = await invokeBroadcastBatch(campaignId, "start_surveys", contactIds);
    lastResult = result;
    batches = batch;
    sentTotal += result.sent;
    failedTotal += result.failed;
    skippedTotal += result.skipped ?? 0;
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

    if (result.sent === 0 && result.failed === 0) {
      break;
    }

    if (pendingRemaining <= 0) {
      break;
    }
  }

  if (!lastResult) {
    throw new Error("broadcast_start_surveys_failed");
  }

  return {
    ...lastResult,
    sent: sentTotal,
    failed: failedTotal,
    skipped: skippedTotal,
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
      mode?: "template" | "start_surveys";
      contact_ids?: string[];
      onProgress?: (progress: BroadcastSendProgress) => void;
    }) => {
      if (input.mode === "start_surveys") {
        return startSurveysForOpenWindowFully(
          input.campaign_id,
          input.onProgress,
          input.contact_ids,
        );
      }
      return sendBroadcastCampaignFully(input.campaign_id, input.onProgress);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "campaigns"] });
      queryClient.invalidateQueries({
        queryKey: ["whatsapp", "campaign-recipients", variables.campaign_id],
      });
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "contacts"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "crm"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "survey"] });
    },
  });
}
