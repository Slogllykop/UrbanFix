-- Migration: 007_production_updates
-- Description: Production-ready schema updates for UrbanFix

-- 1. Add 'rejected' to issue_status enum
ALTER TYPE issue_status ADD VALUE IF NOT EXISTS 'rejected';

-- 2. Add category column to issues
ALTER TABLE issues ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE issues ADD CONSTRAINT chk_issue_category
  CHECK (category IN ('pothole', 'garbage', 'street_lamp'));

-- 3. Add upvotes_count to issues
ALTER TABLE issues ADD COLUMN IF NOT EXISTS upvotes_count INT DEFAULT 0 NOT NULL;

-- 4. Change last_issue_date (DATE) to last_issue_at (TIMESTAMPTZ) on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_issue_at TIMESTAMPTZ;
UPDATE users SET last_issue_at = last_issue_date::timestamptz WHERE last_issue_date IS NOT NULL AND last_issue_at IS NULL;
ALTER TABLE users DROP COLUMN IF EXISTS last_issue_date;

-- 5. Create admin_emails table
CREATE TABLE IF NOT EXISTS admin_emails (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
INSERT INTO admin_emails (email) VALUES ('slogllykop07@gmail.com') ON CONFLICT DO NOTHING;

ALTER TABLE admin_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin emails"
  ON admin_emails FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can insert admin emails"
  ON admin_emails FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete admin emails"
  ON admin_emails FOR DELETE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 6. Update find_nearby_issues to filter by category
CREATE OR REPLACE FUNCTION find_nearby_issues(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_meters INT DEFAULT 50,
  days_back INT DEFAULT 1,
  issue_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  issue_id UUID,
  distance_meters DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    ST_DistanceSphere(
      ST_SetSRID(ST_MakePoint(lng, lat), 4326),
      ST_SetSRID(ST_MakePoint(i.longitude, i.latitude), 4326)
    ) as distance
  FROM issues i
  WHERE i.created_at > NOW() - INTERVAL '1 day' * days_back
    AND (issue_category IS NULL OR i.category = issue_category)
    AND i.status NOT IN ('rejected', 'addressed')
    AND ST_DistanceSphere(
      ST_SetSRID(ST_MakePoint(lng, lat), 4326),
      ST_SetSRID(ST_MakePoint(i.longitude, i.latitude), 4326)
    ) <= radius_meters
  ORDER BY distance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Update update_issue_priority trigger
CREATE OR REPLACE FUNCTION update_issue_priority()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE issues SET
    priority_score = (
      SELECT COALESCE(SUM(CASE WHEN vote_type = 'upvote' THEN 1 ELSE -1 END), 0)
      FROM issue_votes WHERE issue_id = COALESCE(NEW.issue_id, OLD.issue_id)
    ),
    upvotes_count = (
      SELECT COUNT(*) FROM issue_votes
      WHERE issue_id = COALESCE(NEW.issue_id, OLD.issue_id) AND vote_type = 'upvote'
    )
  WHERE id = COALESCE(NEW.issue_id, OLD.issue_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Update handle_new_user to auto-assign roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_role public.user_role := 'user'::public.user_role;
  v_auth_type public.auth_type;
BEGIN
  IF NEW.raw_app_meta_data->>'provider' = 'google' THEN
    v_auth_type := 'oauth'::public.auth_type;
  ELSE
    v_auth_type := 'email'::public.auth_type;
  END IF;

  IF EXISTS (SELECT 1 FROM public.admin_emails WHERE email = NEW.email) THEN
    v_user_role := 'admin'::public.user_role;
  ELSIF EXISTS (SELECT 1 FROM public.ngos WHERE contact_email = NEW.email AND status = 'approved') THEN
    v_user_role := 'ngo'::public.user_role;
  END IF;

  INSERT INTO public.users (id, email, full_name, avatar_url, role, auth_type)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    v_user_role, v_auth_type
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Update RLS: pending + verified visible in home feed
DROP POLICY IF EXISTS "Verified issues are public" ON issues;
CREATE POLICY "Active issues are public"
  ON issues FOR SELECT
  USING (status IN ('pending', 'verified'));

-- 10. Update user profile update policy
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 11. Allow users to update users_reported on issues
CREATE POLICY "Users can update users_reported on issues"
  ON issues FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
