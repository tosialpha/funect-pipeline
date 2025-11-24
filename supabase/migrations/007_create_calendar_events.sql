-- Create calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('task', 'demo', 'meeting', 'call', 'other')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,

  -- Link to prospect for demos
  prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,

  -- Link to user who created the event
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Additional metadata
  location TEXT,
  color TEXT DEFAULT '#00C896',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure end time is after start time
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Add RLS policies
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all events (team collaboration)
CREATE POLICY "Users can view all calendar events"
  ON calendar_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can create their own events
CREATE POLICY "Users can create calendar events"
  ON calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update all events (team can edit each other's events)
CREATE POLICY "Users can update all calendar events"
  ON calendar_events
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Users can delete all events (team can delete events)
CREATE POLICY "Users can delete all calendar events"
  ON calendar_events
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for faster queries
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_events_end_time ON calendar_events(end_time);
CREATE INDEX idx_calendar_events_prospect_id ON calendar_events(prospect_id);
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_event_type ON calendar_events(event_type);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_events_updated_at();

-- Add demo_scheduled_at field to prospects table to track when demos are scheduled
ALTER TABLE prospects
ADD COLUMN IF NOT EXISTS first_demo_scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS second_demo_scheduled_at TIMESTAMPTZ;

-- Create index for demo scheduling
CREATE INDEX IF NOT EXISTS idx_prospects_first_demo_scheduled ON prospects(first_demo_scheduled_at);
CREATE INDEX IF NOT EXISTS idx_prospects_second_demo_scheduled ON prospects(second_demo_scheduled_at);
