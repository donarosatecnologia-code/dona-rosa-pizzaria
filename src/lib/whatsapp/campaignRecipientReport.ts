export const WINDOW_24H_MS = 24 * 60 * 60 * 1000;

export function isWithinLast24Hours(iso: string | null | undefined, nowMs = Date.now()): boolean {
  if (!iso) {
    return false;
  }
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) {
    return false;
  }
  return nowMs - ts <= WINDOW_24H_MS;
}

export interface CampaignRecipientFlags {
  displayStatus: string;
  isFailed: boolean;
  failureReason: string | null;
  wasSent: boolean;
  wasReceived: boolean;
  surveyDone: boolean;
  surveyInProgress: boolean;
  readyForQuestions: boolean;
  needsOi: boolean;
  sentUnconfirmed: boolean;
}

export function classifyCampaignRecipient(input: {
  sendStatus: string;
  failureReason?: string | null;
  responded: boolean;
  surveyStatus: string | null;
  lastInboundAt: string | null;
  isSurveyCampaign: boolean;
  nowMs?: number;
}): CampaignRecipientFlags {
  const nowMs = input.nowMs ?? Date.now();
  const displayStatus =
    input.responded && (input.sendStatus === "failed" || input.sendStatus === "sent")
      ? "delivered"
      : input.sendStatus;
  const isFailed = displayStatus === "failed";
  const failureReason = isFailed
    ? (input.failureReason ?? null)
    : input.responded && input.sendStatus === "failed"
      ? "Respondida — status Meta inconsistente"
      : null;

  const wasSent = ["sent", "delivered", "read"].includes(input.sendStatus) || input.responded;
  const wasReceived =
    ["delivered", "read"].includes(displayStatus) ||
    input.responded ||
    input.surveyStatus === "completed" ||
    input.surveyStatus === "in_progress";

  const surveyDone = input.surveyStatus === "completed";
  const surveyInProgress = input.surveyStatus === "in_progress";
  const openWindow = isWithinLast24Hours(input.lastInboundAt, nowMs);
  const readyForQuestions =
    input.isSurveyCampaign && wasSent && !surveyDone && !surveyInProgress && openWindow;
  const needsOi =
    input.isSurveyCampaign &&
    wasReceived &&
    !surveyDone &&
    !surveyInProgress &&
    !readyForQuestions &&
    !isFailed;
  const sentUnconfirmed = wasSent && !wasReceived && !isFailed;

  return {
    displayStatus,
    isFailed,
    failureReason,
    wasSent,
    wasReceived,
    surveyDone,
    surveyInProgress,
    readyForQuestions,
    needsOi,
    sentUnconfirmed,
  };
}

export function summarizeCampaignRecipients(rows: CampaignRecipientFlags[]) {
  return {
    total: rows.length,
    received: rows.filter((row) => row.wasReceived).length,
    sentUnconfirmed: rows.filter((row) => row.sentUnconfirmed).length,
    failed: rows.filter((row) => row.isFailed).length,
    notSent: rows.filter((row) => !row.wasSent && !row.isFailed).length,
    surveyInProgress: rows.filter((row) => row.surveyInProgress).length,
    readyQuestions: rows.filter((row) => row.readyForQuestions).length,
    needsOi: rows.filter((row) => row.needsOi).length,
    surveyDone: rows.filter((row) => row.surveyDone).length,
  };
}
