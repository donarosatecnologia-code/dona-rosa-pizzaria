
-- Social links table for footer
CREATE TABLE public.social_links (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  platform text NOT NULL,
  url text NOT NULL,
  icon_name text NOT NULL DEFAULT 'link',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_social_links" ON public.social_links FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "admin_insert_social_links" ON public.social_links FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_update_social_links" ON public.social_links FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_delete_social_links" ON public.social_links FOR DELETE TO authenticated USING (is_admin(auth.uid()));

CREATE TRIGGER set_updated_at_social_links BEFORE UPDATE ON public.social_links FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Navigation links table for footer
CREATE TABLE public.nav_links (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  label text NOT NULL,
  url text NOT NULL,
  column_key text NOT NULL DEFAULT 'navegacao',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.nav_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_nav_links" ON public.nav_links FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "admin_insert_nav_links" ON public.nav_links FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_update_nav_links" ON public.nav_links FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_delete_nav_links" ON public.nav_links FOR DELETE TO authenticated USING (is_admin(auth.uid()));

CREATE TRIGGER set_updated_at_nav_links BEFORE UPDATE ON public.nav_links FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Gallery images table for carousel/gallery support
CREATE TABLE public.gallery_images (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  section_key text NOT NULL,
  image_url text NOT NULL,
  alt_text text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_gallery_images" ON public.gallery_images FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "admin_insert_gallery_images" ON public.gallery_images FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_update_gallery_images" ON public.gallery_images FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_delete_gallery_images" ON public.gallery_images FOR DELETE TO authenticated USING (is_admin(auth.uid()));

CREATE TRIGGER set_updated_at_gallery_images BEFORE UPDATE ON public.gallery_images FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Custom sections table
CREATE TABLE public.custom_sections (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  page_key text NOT NULL DEFAULT 'home',
  title text,
  section_key text NOT NULL,
  columns_per_row integer NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  has_paper_texture boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_custom_sections" ON public.custom_sections FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "admin_insert_custom_sections" ON public.custom_sections FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_update_custom_sections" ON public.custom_sections FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_delete_custom_sections" ON public.custom_sections FOR DELETE TO authenticated USING (is_admin(auth.uid()));

CREATE TRIGGER set_updated_at_custom_sections BEFORE UPDATE ON public.custom_sections FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Section elements table
CREATE TABLE public.section_elements (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  section_id bigint NOT NULL REFERENCES public.custom_sections(id) ON DELETE CASCADE,
  element_type text NOT NULL DEFAULT 'text',
  content text,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.section_elements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_section_elements" ON public.section_elements FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "admin_insert_section_elements" ON public.section_elements FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_update_section_elements" ON public.section_elements FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "admin_delete_section_elements" ON public.section_elements FOR DELETE TO authenticated USING (is_admin(auth.uid()));

CREATE TRIGGER set_updated_at_section_elements BEFORE UPDATE ON public.section_elements FOR EACH ROW EXECUTE FUNCTION set_updated_at();
