import type { SurveyStep, SurveyStepOption } from "@/integrations/supabase/types/survey-flows";

export function toSurveySlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function toOptionId(label: string, index: number): string {
  const base = toSurveySlug(label);
  return base ? `${base}-${index}` : `opcao-${index}`;
}

export function createEmptyStep(index: number): SurveyStep {
  return {
    id: `pergunta-${index + 1}`,
    question: "",
    kind: "choice",
    options: [
      { id: "opcao-1", label: "" },
      { id: "opcao-2", label: "" },
    ],
  };
}

export function normalizeSurveySteps(steps: SurveyStep[]): SurveyStep[] {
  return steps.map((step, stepIndex) => {
    const stepId = step.id.trim() || `pergunta-${stepIndex + 1}`;
    if (step.kind === "text") {
      return {
        id: stepId,
        question: step.question.trim(),
        kind: "text",
      };
    }

    const options = (step.options ?? [])
      .map((opt, optIndex) => ({
        id: opt.id.trim() || toOptionId(opt.label, optIndex + 1),
        label: opt.label.trim(),
      }))
      .filter((opt) => opt.label.length > 0);

    return {
      id: stepId,
      question: step.question.trim(),
      kind: "choice",
      options,
    };
  });
}

export function validateSurveyFlow(input: {
  name: string;
  intro_message: string;
  steps: SurveyStep[];
}): string | null {
  if (!input.name.trim()) {
    return "Dê um nome para a pesquisa.";
  }
  if (!input.intro_message.trim()) {
    return "Escreva a mensagem de abertura.";
  }
  if (input.steps.length === 0) {
    return "Adicione pelo menos uma pergunta.";
  }

  for (let i = 0; i < input.steps.length; i++) {
    const step = input.steps[i];
    if (!step.question.trim()) {
      return `A pergunta ${i + 1} está vazia.`;
    }
    if (step.kind === "choice") {
      const options = (step.options ?? []).filter((o) => o.label.trim());
      if (options.length < 2) {
        return `A pergunta ${i + 1} precisa de pelo menos 2 opções.`;
      }
      if (options.length > 10) {
        return `A pergunta ${i + 1} pode ter no máximo 10 opções.`;
      }
    }
  }

  return null;
}

export function ensureUniqueOptionIds(options: SurveyStepOption[]): SurveyStepOption[] {
  const seen = new Set<string>();
  return options.map((opt, index) => {
    let id = opt.id.trim() || toOptionId(opt.label, index + 1);
    if (seen.has(id)) {
      id = `${id}-${index + 1}`;
    }
    seen.add(id);
    return { ...opt, id };
  });
}
