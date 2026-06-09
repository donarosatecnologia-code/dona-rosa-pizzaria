import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { QueueTagRuleType, WhatsappQueue } from "@/integrations/supabase/types/whatsapp-broadcast";

export interface QueueWithTags extends WhatsappQueue {
  includeTagIds: string[];
  excludeTagIds: string[];
}

const QUEUES_KEY = ["whatsapp", "queues"] as const;
const QUEUE_TAGS_KEY = ["whatsapp", "queue-tags"] as const;

/** Filas criadas pelo sistema — não podem ser excluídas pelo painel. */
export const PROTECTED_QUEUE_SLUGS = new Set([
  "clientes-ativos",
  "clientes-inativos",
  "nunca-responderam",
  "homologacao-qa",
]);

function toSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function useWhatsappQueuesWithTags() {
  return useQuery({
    queryKey: [...QUEUES_KEY, "with-tags"],
    queryFn: async (): Promise<QueueWithTags[]> => {
      const [{ data: queues, error: queuesError }, { data: queueTags, error: tagsError }] =
        await Promise.all([
          supabase.from("whatsapp_queues").select("*").order("name"),
          supabase.from("whatsapp_queue_tags").select("queue_id, tag_id, rule_type"),
        ]);

      if (queuesError) {
        throw queuesError;
      }
      if (tagsError) {
        throw tagsError;
      }

      const tagsByQueue = new Map<string, { include: string[]; exclude: string[] }>();
      for (const row of queueTags ?? []) {
        const entry = tagsByQueue.get(row.queue_id) ?? { include: [], exclude: [] };
        if (row.rule_type === "include") {
          entry.include.push(row.tag_id);
        } else {
          entry.exclude.push(row.tag_id);
        }
        tagsByQueue.set(row.queue_id, entry);
      }

      return (queues ?? []).map((queue) => {
        const tags = tagsByQueue.get(queue.id) ?? { include: [], exclude: [] };
        return {
          ...(queue as WhatsappQueue),
          includeTagIds: tags.include,
          excludeTagIds: tags.exclude,
        };
      });
    },
  });
}

export function useSaveWhatsappQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id?: string;
      name: string;
      description?: string;
      includeMatch?: "any" | "all";
      excludeMatch?: "any" | "all";
      includeTagIds: string[];
      excludeTagIds: string[];
    }) => {
      const slug = toSlug(input.name);
      let queueId = input.id;

      if (queueId) {
        const { error } = await supabase
          .from("whatsapp_queues")
          .update({
            name: input.name.trim(),
            description: input.description?.trim() || null,
            include_match: input.includeMatch ?? "any",
            exclude_match: input.excludeMatch ?? "any",
            updated_at: new Date().toISOString(),
          })
          .eq("id", queueId);

        if (error) {
          throw error;
        }
      } else {
        const { data, error } = await supabase
          .from("whatsapp_queues")
          .insert({
            name: input.name.trim(),
            slug,
            description: input.description?.trim() || null,
            include_match: input.includeMatch ?? "any",
            exclude_match: input.excludeMatch ?? "any",
            is_active: true,
          })
          .select("id")
          .single();

        if (error) {
          throw error;
        }

        queueId = data.id;
      }

      const { error: deleteError } = await supabase
        .from("whatsapp_queue_tags")
        .delete()
        .eq("queue_id", queueId!);

      if (deleteError) {
        throw deleteError;
      }

      const tagRows: Array<{ queue_id: string; tag_id: string; rule_type: QueueTagRuleType }> = [
        ...input.includeTagIds.map((tagId) => ({
          queue_id: queueId!,
          tag_id: tagId,
          rule_type: "include" as const,
        })),
        ...input.excludeTagIds.map((tagId) => ({
          queue_id: queueId!,
          tag_id: tagId,
          rule_type: "exclude" as const,
        })),
      ];

      if (tagRows.length > 0) {
        const { error: insertError } = await supabase.from("whatsapp_queue_tags").insert(tagRows);
        if (insertError) {
          throw insertError;
        }
      }

      return queueId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUEUES_KEY });
      queryClient.invalidateQueries({ queryKey: QUEUE_TAGS_KEY });
      queryClient.invalidateQueries({ queryKey: ["whatsapp", "queue-contact-count"] });
    },
  });
}

export function useDeleteWhatsappQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (queueId: string) => {
      const { error } = await supabase.from("whatsapp_queues").delete().eq("id", queueId);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUEUES_KEY });
      queryClient.invalidateQueries({ queryKey: QUEUE_TAGS_KEY });
    },
  });
}
