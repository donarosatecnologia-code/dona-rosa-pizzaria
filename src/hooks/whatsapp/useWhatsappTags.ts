import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WhatsappTag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  is_system: boolean;
  created_at: string;
}

const TAGS_KEY = ["whatsapp", "tags"] as const;

function toSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function useWhatsappTags() {
  return useQuery({
    queryKey: TAGS_KEY,
    queryFn: async (): Promise<WhatsappTag[]> => {
      const { data, error } = await supabase
        .from("whatsapp_tags")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []) as WhatsappTag[];
    },
  });
}

export function useCreateWhatsappTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; description?: string; color?: string }) => {
      const slug = toSlug(input.name);
      const { data, error } = await supabase
        .from("whatsapp_tags")
        .insert({
          name: input.name.trim(),
          slug,
          description: input.description?.trim() || null,
          color: input.color ?? "#64748b",
          is_system: false,
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data as WhatsappTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY });
    },
  });
}

export function useDeleteWhatsappTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase.from("whatsapp_tags").delete().eq("id", tagId);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY });
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "contact-tags"] });
    },
  });
}

export function useToggleContactTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { contactId: string; tagId: string; enabled: boolean }) => {
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
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "contact-tags"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "queue-contact-count"] });
    },
  });
}
