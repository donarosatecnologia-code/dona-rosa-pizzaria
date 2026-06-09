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

export interface SurveyFlow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  intro_message: string;
  steps: SurveyStep[];
  suggested_queue_slug: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SurveySessionAnswer {
  id: string;
  session_id: string;
  step_index: number;
  step_id: string;
  response_value: string;
  response_label: string | null;
  response_type: string;
  received_at: string;
}

export interface SurveySessionWithAnswers {
  id: string;
  contact_id: string;
  status: string;
  completed_at: string | null;
  answers: SurveySessionAnswer[];
}
