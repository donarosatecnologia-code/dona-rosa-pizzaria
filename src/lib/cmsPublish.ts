import { supabase } from "@/integrations/supabase/client";

/** Copia rascunhos para colunas publicadas (site). Requer admin autenticado. */
export async function publishToProduction(): Promise<void> {
  const { error } = await supabase.rpc("publish_page_contents_drafts");
  if (error) {
    throw error;
  }
}
