-- Migration: 008_admin_panel_fixes
-- Description: Fix admin auth, add missing RLS policies, and auto-sync role triggers

-- =============================================================================
-- 1. Promote existing admin_emails users to admin role
-- =============================================================================
UPDATE public.users
SET role = 'admin'::public.user_role
WHERE email IN (SELECT email FROM public.admin_emails)
  AND role != 'admin'::public.user_role;

-- =============================================================================
-- 2. Add missing DELETE policy on ngos table (admin panel "Remove NGO" button)
-- =============================================================================
CREATE POLICY "Admins can delete NGO profiles"
  ON ngos FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================================================
-- 3. Auto-sync trigger: admin_emails -> users.role
--    When an email is added to admin_emails, promote matching user to admin.
--    When an email is removed from admin_emails, demote matching user to 'user'
--    (unless they are an NGO).
-- =============================================================================
CREATE OR REPLACE FUNCTION public.sync_admin_role_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET role = 'admin'::public.user_role
  WHERE email = NEW.email
    AND role != 'admin'::public.user_role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sync_admin_role_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only demote if they are not also an approved NGO
  UPDATE public.users
  SET role = CASE
    WHEN EXISTS (
      SELECT 1 FROM public.ngos
      WHERE contact_email = OLD.email AND status = 'approved'
    ) THEN 'ngo'::public.user_role
    ELSE 'user'::public.user_role
  END
  WHERE email = OLD.email
    AND role = 'admin'::public.user_role;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_admin_email_inserted
  AFTER INSERT ON public.admin_emails
  FOR EACH ROW EXECUTE FUNCTION public.sync_admin_role_on_insert();

CREATE TRIGGER on_admin_email_deleted
  AFTER DELETE ON public.admin_emails
  FOR EACH ROW EXECUTE FUNCTION public.sync_admin_role_on_delete();

-- =============================================================================
-- 4. Auto-sync trigger: ngos -> users.role
--    When an NGO is whitelisted (approved), promote matching user to ngo.
--    When an NGO is removed, demote matching user to 'user'
--    (unless they are also an admin).
-- =============================================================================
CREATE OR REPLACE FUNCTION public.sync_ngo_role_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Only promote if not already admin
  IF NEW.status = 'approved' THEN
    UPDATE public.users
    SET role = 'ngo'::public.user_role
    WHERE email = NEW.contact_email
      AND role = 'user'::public.user_role;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sync_ngo_role_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only demote if they are not also an admin
  UPDATE public.users
  SET role = 'user'::public.user_role
  WHERE email = OLD.contact_email
    AND role = 'ngo'::public.user_role
    AND NOT EXISTS (
      SELECT 1 FROM public.admin_emails WHERE email = OLD.contact_email
    );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_ngo_inserted
  AFTER INSERT ON public.ngos
  FOR EACH ROW EXECUTE FUNCTION public.sync_ngo_role_on_insert();

CREATE TRIGGER on_ngo_deleted
  AFTER DELETE ON public.ngos
  FOR EACH ROW EXECUTE FUNCTION public.sync_ngo_role_on_delete();
