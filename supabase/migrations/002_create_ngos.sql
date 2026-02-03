-- Migration: 002_create_ngos
-- Description: Creates NGO profiles and application tables

-- Create status enum
CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected');

-- NGO applications (before approval)
CREATE TABLE ngo_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  description TEXT NOT NULL,
  status application_status DEFAULT 'pending' NOT NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  reviewed_at TIMESTAMPTZ
);

-- NGO profiles (after approval, linked to auth user)
CREATE TABLE ngos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  description TEXT,
  status application_status DEFAULT 'approved' NOT NULL,
  approved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE ngo_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ngos ENABLE ROW LEVEL SECURITY;

-- Applications are public to submit (unauthenticated users can apply)
CREATE POLICY "Anyone can submit application"
  ON ngo_applications FOR INSERT
  WITH CHECK (true);

-- Admins can view all applications
CREATE POLICY "Admins can view applications"
  ON ngo_applications FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update application status
CREATE POLICY "Admins can update applications"
  ON ngo_applications FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- NGOs can view their own profile
CREATE POLICY "NGOs can view own profile"
  ON ngos FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all NGO profiles
CREATE POLICY "Admins can view all NGO profiles"
  ON ngos FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can insert NGO profiles
CREATE POLICY "Admins can insert NGO profiles"
  ON ngos FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Create index for faster lookups
CREATE INDEX idx_ngo_applications_status ON ngo_applications(status);
CREATE INDEX idx_ngos_user_id ON ngos(user_id);
