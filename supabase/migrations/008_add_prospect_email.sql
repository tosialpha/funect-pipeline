-- Add email field to prospects table
ALTER TABLE prospects
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_prospects_email ON prospects(email);
