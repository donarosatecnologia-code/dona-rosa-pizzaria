import { describe, expect, it } from "vitest";
import {
  classifyCampaignRecipient,
  isWithinLast24Hours,
  summarizeCampaignRecipients,
  WINDOW_24H_MS,
} from "./campaignRecipientReport";

const now = Date.parse("2026-09-19T18:00:00.000Z");

describe("campaignRecipientReport", () => {
  it("reconhece janela Meta 24h", () => {
    expect(isWithinLast24Hours(new Date(now - WINDOW_24H_MS + 60_000).toISOString(), now)).toBe(
      true,
    );
    expect(isWithinLast24Hours(new Date(now - WINDOW_24H_MS - 60_000).toISOString(), now)).toBe(
      false,
    );
    expect(isWithinLast24Hours(null, now)).toBe(false);
  });

  it("entrega e etapa da pesquisa não se misturam", () => {
    const receivedClosedWindow = classifyCampaignRecipient({
      sendStatus: "delivered",
      responded: false,
      surveyStatus: null,
      lastInboundAt: new Date(now - 48 * 60 * 60 * 1000).toISOString(),
      isSurveyCampaign: true,
      nowMs: now,
    });
    const ready = classifyCampaignRecipient({
      sendStatus: "delivered",
      responded: false,
      surveyStatus: null,
      lastInboundAt: new Date(now - 60 * 60 * 1000).toISOString(),
      isSurveyCampaign: true,
      nowMs: now,
    });
    const inProgress = classifyCampaignRecipient({
      sendStatus: "delivered",
      responded: true,
      surveyStatus: "in_progress",
      lastInboundAt: new Date(now - 30 * 60 * 1000).toISOString(),
      isSurveyCampaign: true,
      nowMs: now,
    });
    const sentOnly = classifyCampaignRecipient({
      sendStatus: "sent",
      responded: false,
      surveyStatus: null,
      lastInboundAt: null,
      isSurveyCampaign: true,
      nowMs: now,
    });
    const failed = classifyCampaignRecipient({
      sendStatus: "failed",
      failureReason: "Meta 131026",
      responded: false,
      surveyStatus: null,
      lastInboundAt: null,
      isSurveyCampaign: true,
      nowMs: now,
    });
    const done = classifyCampaignRecipient({
      sendStatus: "delivered",
      responded: true,
      surveyStatus: "completed",
      lastInboundAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      isSurveyCampaign: true,
      nowMs: now,
    });

    expect(receivedClosedWindow.wasReceived).toBe(true);
    expect(receivedClosedWindow.needsOi).toBe(true);
    expect(receivedClosedWindow.readyForQuestions).toBe(false);

    expect(ready.readyForQuestions).toBe(true);
    expect(ready.needsOi).toBe(false);

    expect(inProgress.surveyInProgress).toBe(true);
    expect(inProgress.readyForQuestions).toBe(false);
    expect(inProgress.needsOi).toBe(false);

    expect(sentOnly.sentUnconfirmed).toBe(true);
    expect(sentOnly.wasReceived).toBe(false);
    expect(sentOnly.needsOi).toBe(false);

    const summary = summarizeCampaignRecipients([
      ...Array.from({ length: 588 }, () => receivedClosedWindow),
      ...Array.from({ length: 13 }, () => sentOnly),
      ...Array.from({ length: 100 }, () => failed),
    ]);
    expect(summary.received + summary.sentUnconfirmed + summary.failed).toBe(701);

    const surveySlice = summarizeCampaignRecipients([
      ...Array.from({ length: 166 }, () => receivedClosedWindow),
      ...Array.from({ length: 44 }, () => ready),
      ...Array.from({ length: 377 }, () => inProgress),
      ...Array.from({ length: 1 }, () => done),
    ]);
    expect(
      surveySlice.needsOi +
        surveySlice.readyQuestions +
        surveySlice.surveyInProgress +
        surveySlice.surveyDone,
    ).toBe(588);
  });
});
