-- Migration: 003_create_issues
-- Description: Creates issues and related tables (votes, reports)

-- Create issue status enum
CREATE TYPE issue_status AS ENUM ('pending', 'verified', 'addressed');
CREATE TYPE vote_type AS ENUM ('upvote', 'downvote');

-- Issues table
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  status issue_status DEFAULT 'pending' NOT NULL,
  ai_verified BOOLEAN DEFAULT false NOT NULL,
  priority_score INT DEFAULT 0 NOT NULL,
  users_reported INT DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  addressed_at TIMESTAMPTZ
);

-- Create indexes for common queries
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_created_by ON issues(created_by);
CREATE INDEX idx_issues_created_at ON issues(created_at DESC);
CREATE INDEX idx_issues_priority ON issues(priority_score DESC);

-- Spatial index for location queries (requires PostGIS extension)
-- Note: Run `CREATE EXTENSION IF NOT EXISTS postgis;` in Supabase SQL editor first
CREATE INDEX idx_issues_location ON issues USING GIST (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);

-- Issue votes table
CREATE TABLE issue_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  vote_type vote_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(issue_id, user_id)
);

-- Issue reports table (for tracking multiple reports of same issue)
CREATE TABLE issue_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(issue_id, user_id)
);

-- Create indexes for votes and reports
CREATE INDEX idx_issue_votes_issue ON issue_votes(issue_id);
CREATE INDEX idx_issue_votes_user ON issue_votes(user_id);
CREATE INDEX idx_issue_reports_issue ON issue_reports(issue_id);

-- Enable RLS
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_reports ENABLE ROW LEVEL SECURITY;

-- Issues policies
-- Anyone can view verified issues
CREATE POLICY "Verified issues are public"
  ON issues FOR SELECT
  USING (status = 'verified');

-- Users can view their own pending issues
CREATE POLICY "Users can view own issues"
  ON issues FOR SELECT
  USING (created_by = auth.uid());

-- NGOs and admins can view all issues
CREATE POLICY "NGOs and admins can view all issues"
  ON issues FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ngo', 'admin'))
  );

-- Authenticated users can create issues
CREATE POLICY "Authenticated users can create issues"
  ON issues FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

-- NGOs and admins can update issue status
CREATE POLICY "NGOs can update issue status"
  ON issues FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ngo', 'admin'))
  );

-- Votes policies
CREATE POLICY "Anyone can view votes"
  ON issue_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON issue_votes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update their own vote"
  ON issue_votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vote"
  ON issue_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Reports policies
CREATE POLICY "Users can view their own reports"
  ON issue_reports FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "NGOs and admins can view all reports"
  ON issue_reports FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ngo', 'admin'))
  );

CREATE POLICY "Authenticated users can create reports"
  ON issue_reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Trigger for updated_at on issues
CREATE TRIGGER issues_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to update priority score based on votes
CREATE OR REPLACE FUNCTION update_issue_priority()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE issues
  SET priority_score = (
    SELECT COALESCE(SUM(CASE WHEN vote_type = 'upvote' THEN 1 ELSE -1 END), 0)
    FROM issue_votes
    WHERE issue_id = COALESCE(NEW.issue_id, OLD.issue_id)
  )
  WHERE id = COALESCE(NEW.issue_id, OLD.issue_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to update priority on vote changes
CREATE TRIGGER on_vote_insert
  AFTER INSERT ON issue_votes
  FOR EACH ROW EXECUTE FUNCTION update_issue_priority();

CREATE TRIGGER on_vote_update
  AFTER UPDATE ON issue_votes
  FOR EACH ROW EXECUTE FUNCTION update_issue_priority();

CREATE TRIGGER on_vote_delete
  AFTER DELETE ON issue_votes
  FOR EACH ROW EXECUTE FUNCTION update_issue_priority();

-- Function to check for duplicate issues within radius
CREATE OR REPLACE FUNCTION find_nearby_issues(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_meters INT DEFAULT 50,
  days_back INT DEFAULT 7
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
    AND ST_DistanceSphere(
      ST_SetSRID(ST_MakePoint(lng, lat), 4326),
      ST_SetSRID(ST_MakePoint(i.longitude, i.latitude), 4326)
    ) <= radius_meters
  ORDER BY distance;
END;
$$ LANGUAGE plpgsql;
