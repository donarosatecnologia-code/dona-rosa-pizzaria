import { describe, expect, it } from "vitest";
import { buildCampaignReportCsv } from "./exportSurveyCsv";

describe("buildCampaignReportCsv", () => {
  it("exporta só as linhas do filtro Pedir oi", () => {
    const csv = buildCampaignReportCsv(
      "pesquisa-ativos",
      "Pedir oi",
      [
        {
          name: "CINTIA",
          phone: "+55 11 99659-5176",
          phoneDigits: "5511996595176",
          sendStatus: "delivered",
          deliveryLabel: "Receberam o template",
          surveyStageLabel: "Pedir oi",
          openWindowLabel: "Não",
          failureReason: "",
          sentAt: "18/09/2026 14:39",
          lastInboundAt: "",
        },
      ],
      [],
    );

    expect(csv.startsWith("sep=;")).toBe(true);
    expect(csv).toContain("Pedir oi");
    expect(csv).toContain("CINTIA");
    expect(csv).toContain("5511996595176");
    expect(csv).not.toContain("Prontos p/ perguntas");
  });
});
