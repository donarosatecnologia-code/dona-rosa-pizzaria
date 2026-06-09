import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CONTACT_TAGS_KEY = ["whatsapp", "contact-tags"] as const;
const QA_TAG_SLUG = "qa-homologacao";

export interface ContactTagEntry {
  contactId: string;
  tagId: string;
  slug: string;
  name: string;
}

export function useWhatsappContactTagMap() {
  return useQuery({
    queryKey: CONTACT_TAGS_KEY,
    queryFn: async (): Promise<Map<string, ContactTagEntry[]>> => {
      const { data, error } = await supabase
        .from("whatsapp_contact_tags")
        .select("contact_id, tag_id, whatsapp_tags ( slug, name )");

      if (error) {
        throw error;
      }

      const map = new Map<string, ContactTagEntry[]>();

      for (const row of data ?? []) {
        const tag = row.whatsapp_tags as { slug: string; name: string } | null;
        if (!tag?.slug) {
          continue;
        }
        const list = map.get(row.contact_id) ?? [];
        list.push({
          contactId: row.contact_id,
          tagId: row.tag_id,
          slug: tag.slug,
          name: tag.name,
        });
        map.set(row.contact_id, list);
      }

      return map;
    },
  });
}

export function useQaHomologacaoTag() {
  return useQuery({
    queryKey: ["whatsapp", "tags", QA_TAG_SLUG],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_tags")
        .select("id, name, slug")
        .eq("slug", QA_TAG_SLUG)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
  });
}

export function useToggleQaHomologacaoTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { contactId: string; enabled: boolean; tagId: string }) => {
      if (input.enabled) {
        const { error } = await supabase.from("whatsapp_contact_tags").insert({
          contact_id: input.contactId,
          tag_id: input.tagId,
          assigned_by: "admin",
        });

        if (error && error.code !== "23505") {
          throw error;
        }
        return;
      }

      const { error } = await supabase
        .from("whatsapp_contact_tags")
        .delete()
        .eq("contact_id", input.contactId)
        .eq("tag_id", input.tagId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACT_TAGS_KEY });
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "queue-contact-count"] });
    },
  });
}
