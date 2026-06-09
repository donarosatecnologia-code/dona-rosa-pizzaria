import { describe, expect, it } from "vitest";
import {
  createEmptyStep,
  normalizeSurveySteps,
  toSurveySlug,
  validateSurveyFlow,
} from "./survey-flow-utils";

describe("survey-flow-utils", () => {
  it("gera slug a partir do nome", () => {
    expect(toSurveySlug("Pesquisa Delivery 2025")).toBe("pesquisa-delivery-2025");
  });

  it("valida pesquisa mínima", () => {
    const err = validateSurveyFlow({
      name: "",
      intro_message: "Oi",
      steps: [createEmptyStep(0)],
    });
    expect(err).toMatch(/nome/i);
  });

  it("exige 2 opções em pergunta choice", () => {
    const err = validateSurveyFlow({
      name: "Teste",
      intro_message: "Oi",
      steps: [
        {
          id: "q1",
          question: "Pergunta?",
          kind: "choice",
          options: [{ id: "a", label: "Só uma" }],
        },
      ],
    });
    expect(err).toMatch(/2 opções/i);
  });

  it("normaliza steps de texto", () => {
    const steps = normalizeSurveySteps([
      { id: "t1", question: "  Livre?  ", kind: "text" },
    ]);
    expect(steps[0]).toEqual({ id: "t1", question: "Livre?", kind: "text" });
  });

  it("aceita pesquisa válida", () => {
    const err = validateSurveyFlow({
      name: "QA",
      intro_message: "Olá",
      steps: [
        {
          id: "q1",
          question: "Frequência?",
          kind: "choice",
          options: [
            { id: "a", label: "Semana" },
            { id: "b", label: "Mês" },
          ],
        },
      ],
    });
    expect(err).toBeNull();
  });
});
