export interface SurveyStepOption {
  id: string;
  label: string;
}

export interface SurveyStep {
  id: string;
  question: string;
  kind: "choice" | "text";
  options?: SurveyStepOption[];
}

export interface SurveyFlowRow {
  id: string;
  slug: string;
  name: string;
  intro_message: string;
  steps: SurveyStep[];
}

export interface SurveySessionRow {
  id: string;
  flow_id: string;
  campaign_id: string | null;
  contact_id: string;
  current_step_index: number;
  status: string;
}

export function parseSurveySteps(raw: unknown): SurveyStep[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((step): step is SurveyStep => {
    return (
      typeof step === "object" &&
      step !== null &&
      typeof (step as SurveyStep).id === "string" &&
      typeof (step as SurveyStep).question === "string" &&
      ((step as SurveyStep).kind === "choice" || (step as SurveyStep).kind === "text")
    );
  });
}
