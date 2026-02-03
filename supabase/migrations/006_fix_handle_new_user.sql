-- Migration: 006_fix_handle_new_user
-- Description: Updates handle_new_user function with better error handling and search path

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_role public.user_role := 'user'::public.user_role;
  v_auth_type public.auth_type;
BEGIN
  -- Determine auth type
  IF NEW.raw_app_meta_data->>'provider' = 'google' THEN
    v_auth_type := 'oauth'::public.auth_type;
  ELSE
    v_auth_type := 'email'::public.auth_type;
  END IF;

  INSERT INTO public.users (id, email, full_name, avatar_url, role, auth_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url',
    v_user_role,
    v_auth_type
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
