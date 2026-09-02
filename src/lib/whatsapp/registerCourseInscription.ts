import { supabase } from "@/integrations/supabase/client";

export interface RegisterCourseInscriptionInput {
  event: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
}

export interface RegisterCourseInscriptionResult {
  ok: boolean;
  contact_id?: string;
  error?: string;
}

export async function registerCourseInscription(
  input: RegisterCourseInscriptionInput,
): Promise<RegisterCourseInscriptionResult> {
  const { data, error } = await supabase.functions.invoke<RegisterCourseInscriptionResult>(
    "register-course-inscription",
    { body: input },
  );

  if (error) {
    throw error;
  }

  if (!data?.ok) {
    throw new Error(data?.error ?? "registration_failed");
  }

  return data;
}
