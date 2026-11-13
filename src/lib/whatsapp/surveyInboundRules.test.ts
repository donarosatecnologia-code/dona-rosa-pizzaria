import { describe, expect, it } from "vitest";
import {
  decideSurveyInbound,
  shouldRestartSurveySession,
  shouldStartSurveyAfterInbound,
  SURVEY_SESSION_TTL_MS,
} from "./surveyInboundRules";

describe("surveyInboundRules", () => {
  it("não inicia pesquisa em resposta a mensagem ativa informativa", () => {
    expect(
      shouldStartSurveyAfterInbound({
        contextMessageId: "wamid.nova-ativa",
        repliedCampaignHasSurveyFlow: false,
        hasCompletedSession: false,
        hasInProgressSession: false,
      }),
    ).toBe(false);
  });

  it("não inicia pesquisa se o cliente só mandou um oi (sem reply ao template)", () => {
    expect(
      shouldStartSurveyAfterInbound({
        contextMessageId: null,
        repliedCampaignHasSurveyFlow: true,
        hasCompletedSession: false,
        hasInProgressSession: false,
      }),
    ).toBe(false);
  });

  it("inicia pesquisa só no reply ao template da campanha de pesquisa", () => {
    expect(
      shouldStartSurveyAfterInbound({
        contextMessageId: "wamid.pesquisa",
        repliedCampaignHasSurveyFlow: true,
        hasCompletedSession: false,
        hasInProgressSession: false,
      }),
    ).toBe(true);
  });

  it("não reinicia sessão já em andamento (evita 3x intro + pergunta)", () => {
    expect(
      shouldRestartSurveySession({
        hasInProgressForCampaign: true,
        hasInProgressAny: false,
      }),
    ).toBe("already_active");
  });

  it("pedido de pizza em texto livre sai da pesquisa e vai para o inbox", () => {
    expect(
      decideSurveyInbound({
        hasInProgressSession: true,
        sessionUpdatedAt: new Date().toISOString(),
        stepKind: "choice",
        isInteractiveChoice: false,
        bodyText: "quero 1 calabresa e 1 mussarela",
      }),
    ).toBe("abandon_and_leave_to_inbox");
  });

  it("sessão parada há mais de 24h não intercepta atendimento", () => {
    const now = Date.now();
    expect(
      decideSurveyInbound({
        hasInProgressSession: true,
        sessionUpdatedAt: new Date(now - SURVEY_SESSION_TTL_MS - 1000).toISOString(),
        stepKind: "choice",
        isInteractiveChoice: true,
        bodyText: "semana",
        nowMs: now,
      }),
    ).toBe("abandon_and_leave_to_inbox");
  });
});
