import { supabase } from "@/integrations/supabase/client";

export async function fetchNavLinks() {
  const { data, error } = await supabase.from("nav_links").select("*").order("sort_order");
  if (error) {
    throw error;
  }
  return data;
}

export async function fetchSocialLinks() {
  const { data, error } = await supabase.from("social_links").select("*").order("sort_order");
  if (error) {
    throw error;
  }
  return data;
}

export async function fetchFooterCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("name, slug")
    .eq("is_active", true)
    .order("sort_order");
  if (error) {
    throw error;
  }
  return data;
}

export interface PageContentBatchRow {
  section_key: string;
  title: string | null;
  content: string | null;
  subtitle: string | null;
  image_url: string | null;
  title_draft: string | null;
  content_draft: string | null;
  image_url_draft: string | null;
}

export async function fetchPageContentsBatch(pageKey: string | undefined, sectionKeys: string[]) {
  let query = supabase
    .from("page_contents")
    .select("section_key, title, content, subtitle, image_url, title_draft, content_draft, image_url_draft")
    .in("section_key", sectionKeys);
  if (pageKey) {
    query = query.eq("page_key", pageKey);
  }
  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return data as PageContentBatchRow[];
}

export async function fetchPageContentImageRow(sectionKey: string) {
  const { data, error } = await supabase
    .from("page_contents")
    .select("image_url, image_url_draft, content, content_draft")
    .eq("section_key", sectionKey)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data;
}

export async function fetchGalleryImages(sectionKey: string) {
  const { data, error } = await supabase
    .from("gallery_images")
    .select("id, image_url, alt_text, sort_order")
    .eq("section_key", sectionKey)
    .eq("is_active", true)
    .order("sort_order");
  if (error) {
    throw error;
  }
  return data;
}

export async function fetchCarouselColumnsRow(sectionKey: string) {
  const { data, error } = await supabase
    .from("page_contents")
    .select("content, content_draft")
    .eq("section_key", sectionKey)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data;
}
