
-- 1. Change the default role on the users table from 'admin' to 'user'
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'user';

-- 2. Replace the handle_new_user trigger function to assign 'user' role by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.users (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    CASE
      WHEN NEW.email = 'donarosatecnologia@gmail.com' THEN 'admin'
      ELSE 'user'
    END
  );
  RETURN NEW;
END;
$function$;
