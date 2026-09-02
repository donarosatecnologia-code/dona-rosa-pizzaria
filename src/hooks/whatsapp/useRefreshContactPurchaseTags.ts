import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CONTACTS_KEY } from "./useWhatsappContacts";

const STORAGE_KEY = "whatsapp-contacts-purchase-tags-refreshed-at";

function todayKey(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

/** Recalcula etiquetas de compra uma vez por dia ao abrir a lista de clientes. */
export function useRefreshContactPurchaseTagsOnPage() {
  const queryClient = useQueryClient();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    const lastRun = sessionStorage.getItem(STORAGE_KEY);
    if (lastRun === todayKey()) {
      return;
    }

    void (async () => {
      const { error } = await supabase.rpc("refresh_all_contact_purchase_tags");
      if (!error) {
        sessionStorage.setItem(STORAGE_KEY, todayKey());
        await queryClient.invalidateQueries({ queryKey: CONTACTS_KEY });
        await queryClient.invalidateQueries({ queryKey: ["whatsapp", "contact-tags"] });
      }
    })();
  }, [queryClient]);
}
