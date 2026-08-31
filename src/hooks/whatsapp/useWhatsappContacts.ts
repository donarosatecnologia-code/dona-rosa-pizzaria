import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LIST_PAGE_SIZE } from "@/hooks/usePagedItems";
import { supabase } from "@/integrations/supabase/client";
import type { WhatsappContact } from "@/integrations/supabase/types/whatsapp-broadcast";
import { TELEFONE_FIXO_TAG_SLUG } from "@/lib/whatsapp/contactTelefoneFixo";
import { fetchAllRows } from "@/lib/supabase/fetchAllRows";

export const CONTACTS_KEY = ["whatsapp", "contacts"] as const;

function sanitizeSearchToken(value: string): string {
  return value.replace(/[%_,()]/g, " ").trim();
}

export function useWhatsappContacts() {
  return useQuery({
    queryKey: CONTACTS_KEY,
    queryFn: async (): Promise<WhatsappContact[]> => {
      return fetchAllRows<WhatsappContact>((from, to) =>
        supabase
          .from("whatsapp_contacts")
          .select("*")
          .order("last_inbound_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
          .range(from, to),
      );
    },
  });
}

export function useWhatsappContactsCount() {
  return useQuery({
    queryKey: [...CONTACTS_KEY, "count"],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("whatsapp_contacts")
        .select("id", { count: "exact", head: true });

      if (error) {
        throw error;
      }

      return count ?? 0;
    },
  });
}

export function useWhatsappContactsByIds(ids: string[]) {
  const uniqueIds = [...new Set(ids)].sort();

  return useQuery({
    queryKey: [...CONTACTS_KEY, "by-ids", uniqueIds],
    enabled: uniqueIds.length > 0,
    queryFn: async (): Promise<WhatsappContact[]> => {
      const all: WhatsappContact[] = [];
      for (let i = 0; i < uniqueIds.length; i += 200) {
        const chunk = uniqueIds.slice(i, i + 200);
        const { data, error } = await supabase
          .from("whatsapp_contacts")
          .select("*")
          .in("id", chunk);

        if (error) {
          throw error;
        }

        all.push(...((data ?? []) as WhatsappContact[]));
      }
      return all;
    },
  });
}

export interface WhatsappContactsPageResult {
  items: WhatsappContact[];
  total: number;
}

export function useWhatsappContactsPage(options: {
  page: number;
  search: string;
  excludeContactIds?: string[];
  pageSize?: number;
  tagFilter?: { slug: string; tagId?: string } | null;
}) {
  const pageSize = options.pageSize ?? LIST_PAGE_SIZE;
  const search = options.search.trim();
  const excludeIds = options.excludeContactIds ?? [];
  const tagFilter = options.tagFilter ?? null;

  return useQuery({
    queryKey: [...CONTACTS_KEY, "page", options.page, pageSize, search, excludeIds, tagFilter],
    queryFn: async (): Promise<WhatsappContactsPageResult> => {
      const from = options.page * pageSize;
      const to = from + pageSize - 1;

      const isTelefoneFixoFilter = tagFilter?.slug === TELEFONE_FIXO_TAG_SLUG;
      const tagId = !isTelefoneFixoFilter ? tagFilter?.tagId : undefined;

      let query = tagId
        ? supabase
            .from("whatsapp_contacts")
            .select("*, whatsapp_contact_tags!inner(tag_id)", { count: "exact" })
            .eq("whatsapp_contact_tags.tag_id", tagId)
        : supabase.from("whatsapp_contacts").select("*", { count: "exact" });

      query = query
        .order("last_inbound_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (isTelefoneFixoFilter) {
        query = query.eq("is_landline", true);
      }

      if (search) {
        const digits = search.replace(/\D/g, "");
        const nameToken = sanitizeSearchToken(search);
        if (nameToken && digits) {
          query = query.or(`name.ilike.%${nameToken}%,phone_number.ilike.%${digits}%`);
        } else if (digits) {
          query = query.ilike("phone_number", `%${digits}%`);
        } else if (nameToken) {
          query = query.ilike("name", `%${nameToken}%`);
        }
      }

      if (excludeIds.length > 0) {
        query = query.not("id", "in", `(${excludeIds.join(",")})`);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) {
        throw error;
      }

      return {
        items: (data ?? []) as WhatsappContact[],
        total: count ?? 0,
      };
    },
  });
}

export function useCreateWhatsappContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; phone_number: string }) => {
      const phone = input.phone_number.replace(/\D/g, "");
      const { data, error } = await supabase
        .from("whatsapp_contacts")
        .insert({
          name: input.name.trim(),
          phone_number: phone,
          status: "active",
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      return data as WhatsappContact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_KEY });
    },
  });
}
