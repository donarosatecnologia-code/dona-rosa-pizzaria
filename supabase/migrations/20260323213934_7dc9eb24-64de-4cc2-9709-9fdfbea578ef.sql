
-- Function to check if user is admin (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = _user_id AND role = 'admin' AND is_active = true
  )
$$;

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'admin');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- Storage RLS policies
CREATE POLICY "public_read_images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'images');
CREATE POLICY "admin_upload_images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images' AND public.is_admin(auth.uid()));
CREATE POLICY "admin_update_images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'images' AND public.is_admin(auth.uid()));
CREATE POLICY "admin_delete_images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'images' AND public.is_admin(auth.uid()));

-- Admin CRUD on page_contents
CREATE POLICY "admin_insert_page_contents" ON public.page_contents FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "admin_update_page_contents" ON public.page_contents FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "admin_delete_page_contents" ON public.page_contents FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Admin CRUD on products
CREATE POLICY "admin_insert_products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "admin_update_products" ON public.products FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "admin_delete_products" ON public.products FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Admin CRUD on categories
CREATE POLICY "admin_insert_categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "admin_update_categories" ON public.categories FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "admin_delete_categories" ON public.categories FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Users insert for auto-profile creation
CREATE POLICY "insert_own_profile" ON public.users FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
