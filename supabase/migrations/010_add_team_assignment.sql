-- Migration 010: Add team assignment system to calendar_events and prospects
-- This creates consistency across todos, calendar events, and prospects

-- =============================================================================
-- PART 1: Calendar Events - Add assigned_to column
-- =============================================================================

-- Add assigned_to column with same constraint as todos
ALTER TABLE calendar_events
ADD COLUMN assigned_to TEXT DEFAULT 'team'
CHECK (assigned_to IN ('team', 'veeti', 'alppa'));

-- Create index for faster filtering by assignee
CREATE INDEX idx_calendar_events_assigned_to ON calendar_events(assigned_to);

-- =============================================================================
-- PART 2: Prospects - Convert responsible_person to constrained values
-- =============================================================================

-- Create new constrained column
ALTER TABLE prospects
ADD COLUMN responsible_person_new TEXT
CHECK (responsible_person_new IN ('team', 'veeti', 'alppa'));

-- Migrate existing data with pattern matching (case-insensitive)
UPDATE prospects
SET responsible_person_new = CASE
  WHEN LOWER(TRIM(responsible_person)) LIKE '%veeti%' THEN 'veeti'
  WHEN LOWER(TRIM(responsible_person)) LIKE '%alppa%' THEN 'alppa'
  WHEN responsible_person IS NOT NULL AND TRIM(responsible_person) != '' THEN 'team'
  ELSE NULL
END;

-- Drop the old column
ALTER TABLE prospects DROP COLUMN responsible_person;

-- Rename new column to original name
ALTER TABLE prospects RENAME COLUMN responsible_person_new TO responsible_person;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_prospects_responsible_person ON prospects(responsible_person);
