-- Migration: 009_replace_street_lamp_with_water_clog
-- Description: Replaces the 'street_lamp' issue category with 'water_clog'

-- 1. Update existing issues that have the 'street_lamp' category
UPDATE issues SET category = 'water_clog' WHERE category = 'street_lamp';

-- 2. Drop the old category constraint
ALTER TABLE issues DROP CONSTRAINT IF EXISTS chk_issue_category;

-- 3. Add the new constraint with 'water_clog' instead of 'street_lamp'
ALTER TABLE issues ADD CONSTRAINT chk_issue_category
  CHECK (category IN ('pothole', 'garbage', 'water_clog'));
